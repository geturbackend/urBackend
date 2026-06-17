import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PUBLIC_API_URL } from '../config';
import toast from 'react-hot-toast';
import {
    Rocket,
    Database,
    Key,
    CheckCircle,
    AlertTriangle,
    Copy,
    Plus,
    Trash2,
    Play,
    Check,
    RefreshCw,
    Mail,
    Eye,
    EyeOff
} from 'lucide-react';
import Hyperspeed from '../components/Hyperspeed/Hyperspeed';

const PRIMITIVE_TYPES = ['String', 'Number', 'Boolean', 'Date'];

function createEmptyField(key = '', type = 'String', required = false, unique = false) {
    return { key, type, required, unique };
}

export default function Onboarding() {
    const { user, login } = useAuth();
    const { progress, refreshUser } = useOnboarding();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine step from route path
    const isProjectStep = location.pathname === '/onboarding/project';
    const isCollectionStep = location.pathname === '/onboarding/collection';
    const isApiStep = location.pathname === '/onboarding/api';

    // ----------------------------------------------------
    // STEP 1 STATE: Project
    // ----------------------------------------------------
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [mongoUri, setMongoUri] = useState('');
    const [includeUsers, setIncludeUsers] = useState(true);
    const [projectLoading, setProjectLoading] = useState(false);
    const [existingProject, setExistingProject] = useState(null);

    // ----------------------------------------------------
    // STEP 2 STATE: Collection
    // ----------------------------------------------------
    const [collectionName, setCollectionName] = useState('products');
    const [fields, setFields] = useState([
        createEmptyField('name', 'String', true),
        createEmptyField('price', 'Number', false),
        createEmptyField('inStock', 'Boolean', false),
    ]);
    const [collectionLoading, setCollectionLoading] = useState(false);
    const [existingCollection, setExistingCollection] = useState(null);

    // ----------------------------------------------------
    // STEP 3 STATE: API Credentials & Testing
    // ----------------------------------------------------
    const [publishableKey, setPublishableKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [keysLoading, setKeysLoading] = useState(false);
    const [revealSecret, setRevealSecret] = useState(false);
    const [activeTab, setActiveTab] = useState('sdk'); // sdk | fetch | curl
    const [testResponse, setTestResponse] = useState(null);
    const [testLoading, setTestLoading] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);

    // Verification Modal State
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // Load existing project if step 1 is already complete
    useEffect(() => {
        if (progress.create_project && progress.projectId) {
            api.get(`/api/projects/${progress.projectId}`)
                .then(res => setExistingProject(res.data.data || res.data))
                .catch(err => console.error("Failed to fetch existing project:", err));
        }
    }, [progress.create_project, progress.projectId]);

    // Load existing collection if step 2 is already complete
    useEffect(() => {
        if (progress.create_collection && progress.projectId && progress.collectionId) {
            api.get(`/api/projects/${progress.projectId}`)
                .then(res => {
                    const projectData = res.data.data || res.data;
                    const collections = projectData.collections || [];
                    const col = collections.find(c => c._id === progress.collectionId) || collections.find(c => c.name !== 'users');
                    setExistingCollection(col);
                    if (col && col.name) setCollectionName(col.name);
                })
                .catch(err => console.error("Failed to fetch existing collection:", err));
        } else if (existingProject) {
            const col = existingProject.collections?.find(c => c.name !== 'users');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (col && col.name) setCollectionName(col.name);
        }
    }, [progress.create_collection, progress.projectId, progress.collectionId, existingProject]);

    const fetchKeys = async (projId) => {
        if (publishableKey || secretKey) return;
        setKeysLoading(true);
        try {
            // For onboarding we call regenerate / reveal keys endpoints
            const [pubRes, secRes] = await Promise.all([
                api.post(`/api/projects/${projId}/api-key`, { keyType: 'publishable' }),
                api.post(`/api/projects/${projId}/api-key`, { keyType: 'secret' })
            ]);
            setPublishableKey(pubRes.data.apiKey);
            setSecretKey(secRes.data.apiKey);
        } catch (err) {
            console.error("Failed to load API keys:", err);
            toast.error("Failed to generate API credentials. Please try again.");
        } finally {
            setKeysLoading(false);
        }
    };

    // Check verification status periodically if modal is open
    useEffect(() => {
        if (!showVerifyModal) return;
        const interval = setInterval(async () => {
            try {
                const res = await api.get('/api/auth/me');
                if (res.data.success && res.data.data.user?.isVerified) {
                    login(res.data.data.user);
                    queueMicrotask(() => setShowVerifyModal(false));
                    toast.success("Email verified!");
                    fetchKeys(progress.projectId);
                }
            } catch {
                // Ignore background errors
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [showVerifyModal, progress.projectId, login]);

    // If verified, fetch keys on load of API step
    useEffect(() => {
        if (isApiStep && progress.projectId) {
            if (user?.isVerified) {
                queueMicrotask(() => fetchKeys(progress.projectId));
            } else {
                queueMicrotask(() => setShowVerifyModal(true));
            }
        }
    }, [isApiStep, progress.projectId, user?.isVerified]);

    // ----------------------------------------------------
    // STEP 1 HANDLER: Create Project
    // ----------------------------------------------------
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!projectName.trim()) return toast.error("Project Name is required");
        setProjectLoading(true);

        try {
            // 1. Create project
            const res = await api.post('/api/projects', {
                name: projectName,
                description: projectDesc
            });
            const projectData = res.data.data || res.data;
            const createdProjectId = projectData._id;

            // 2. Attach external database connection if Mongo URI is specified
            if (mongoUri.trim()) {
                await api.patch(`/api/projects/${createdProjectId}/byod-config`, {
                    dbUri: mongoUri.trim()
                });
            }

            // 3. Provision standard Users collection if includeUsers is checked
            if (includeUsers) {
                const usersSchema = [
                    { key: 'email', type: 'String', required: true },
                    { key: 'password', type: 'String', required: true },
                    { key: 'username', type: 'String', required: false },
                    { key: 'emailVerified', type: 'Boolean', required: false }
                ];
                await api.post(`/api/projects/${createdProjectId}/collections`, {
                    projectId: createdProjectId,
                    collectionName: 'users',
                    schema: usersSchema
                });
            }

            toast.success("Project created successfully!");
            await refreshUser();
            navigate('/onboarding/collection');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to create project";
            toast.error(typeof errorMsg === 'object' ? "Validation Error" : errorMsg);
        } finally {
            setProjectLoading(false);
        }
    };

    // ----------------------------------------------------
    // STEP 2 HANDLERS: Collection Builder
    // ----------------------------------------------------
    const addField = () => {
        setFields([...fields, createEmptyField()]);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index, prop, val) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], [prop]: val };
        setFields(updated);
    };

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        const normName = collectionName.trim().toLowerCase();
        if (!normName) return toast.error("Collection Name is required");
        if (normName === 'users') return toast.error("The 'users' collection is reserved for system auth.");

        if (fields.some(f => !f.key.trim())) {
            return toast.error("All fields must have a name");
        }

        setCollectionLoading(true);
        try {
            const cleanFields = fields.map(({ key, type, required, unique }) => ({
                key: key.trim(),
                type,
                required: !!required,
                unique: !!unique
            }));

            await api.post(`/api/projects/${progress.projectId}/collections`, {
                projectId: progress.projectId,
                collectionName: normName,
                schema: cleanFields
            });

            toast.success("Collection created successfully!");
            await refreshUser();
            navigate('/onboarding/api');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to create collection";
            toast.error(typeof errorMsg === 'object' ? "Validation Error" : errorMsg);
        } finally {
            setCollectionLoading(false);
        }
    };

    // ----------------------------------------------------
    // STEP 3 HANDLERS: API Keys & Verification
    // ----------------------------------------------------
    const triggerSendOtp = async () => {
        setVerifyLoading(true);
        try {
            await api.post('/api/auth/send-otp', { email: user?.email });
            setOtpSent(true);
            setCountdown(60);
            toast.success("OTP sent to your email!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send verification code");
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode.trim()) return toast.error("Enter the OTP code");
        setVerifyLoading(true);

        try {
            const res = await api.post('/api/auth/verify-otp', {
                email: user?.email,
                otp: otpCode.trim()
            });
            if (res.data.success) {
                login(res.data.data.user);
            }
            setShowVerifyModal(false);
            toast.success("Email verified!");
            fetchKeys(progress.projectId);
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP code");
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleTestApi = async () => {
        setTestLoading(true);
        setTestResponse(null);
        setTestSuccess(false);

        // Fetch collection name from project
        try {
            let colName = collectionName;
            // If they skipped creating a collection in this session, fall back to what's in the DB
            if (!colName || colName === 'products') {
                const projRes = await api.get(`/api/projects/${progress.projectId}`);
                const projectData = projRes.data.data || projRes.data;
                const collections = projectData.collections || [];
                const nonUsersCollections = collections.filter(c => c.name !== 'users');
                colName = nonUsersCollections.find(c => c._id === progress.collectionId)?.name || nonUsersCollections[nonUsersCollections.length - 1]?.name || 'products';
            }

            const url = `${PUBLIC_API_URL}/api/data/${colName}`;
            const headers = {
                'x-api-key': publishableKey
            };

            const response = await fetch(url, { headers });
            const data = await response.json();
            
            setTestResponse(data);
            if (response.ok) {
                setTestSuccess(true);
                toast.success("API Call Successful!");
                // Explicitly mark firstApiCall in onboarding as completed in the backend
                try {
                    await api.patch('/api/user/onboarding', { steps: { firstApiCall: true } });
                } catch (err) {
                    console.error("Failed to update onboarding step", err);
                }
                setTimeout(async () => {
                    await refreshUser();
                }, 1500);
            } else {
                toast.error(data.message || "API request failed");
            }
        } catch (err) {
            setTestResponse({ error: err.message || "Failed to execute request" });
            toast.error("Network connection failed.");
        } finally {
            setTestLoading(false);
        }
    };

    const handleFinishOnboarding = async () => {
        try {
            await api.patch('/api/user/onboarding', { completed: true });
        } catch (e) {
            console.error("Failed to mark onboarding as completed", e);
        }
        await refreshUser();
        navigate('/dashboard');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    // Interpolated Code Samples
    const codeSamples = {
        sdk: `import { URBackend } from '@urbackend/sdk';\n\nconst client = new URBackend({\n    publicKey: "${publishableKey || 'pk_live_••••••••'}"\n});\n\n// Create a record\nawait client.collection('${collectionName}').create({\n    // your fields here\n});\n\n// Fetch items\n/*\nconst items = await client.collection('${collectionName}').find();\nconsole.log(items);\n*/`,
        fetch: `// Insert into public API\nfetch('${PUBLIC_API_URL}/api/data/${collectionName}', {\n    method: 'POST',\n    headers: {\n        'Content-Type': 'application/json',\n        'x-api-key': '${publishableKey || 'pk_live_••••••••'}'\n    },\n    body: JSON.stringify({ /* your data */ })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
        curl: `curl -X POST ${PUBLIC_API_URL}/api/data/${collectionName} \\\n     -H "x-api-key: ${publishableKey || 'pk_live_••••••••'}" \\\n     -H "Content-Type: application/json" \\\n     -d '{"exampleKey": "exampleValue"}'`
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#f3f4f6',
            background: '#000000'
        }}>

            {/* Hyperspeed animated background (Lightweight for performance) */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <Hyperspeed effectOptions={{
                    speedUp: 2,
                    totalSideLightSticks: 5,     // Light weight
                    lightPairsPerRoadWay: 15,    // Light weight
                    colors: {
                        roadColor: 0x080808,
                        islandColor: 0x0a0a0a,
                        background: 0x000000,
                        shoulderLines: 0x131318,
                        brokenLines: 0x131318,
                        leftCars: [0x10b981, 0x34d399, 0x059669], // Green cars to match theme
                        rightCars: [0x10b981, 0x34d399, 0x059669],
                        sticks: 0x10b981,
                    }
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.95) 100%)', zIndex: 1 }} />
            </div>

            {/* Content wrapper so it sits above background */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {/* Custom styles override */}
            <style>{`
                .flat-container {
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    width: 100%;
                }
                .form-input {
                    background: #111111;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    width: 100%;
                    outline: none;
                    transition: all 0.2s ease;
                }
                .form-input:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
                }
                .btn-primary {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    alignItems: center;
                    justifyContent: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #34d399;
                    transform: translateY(-1px);
                }
                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .step-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.15);
                    transition: all 0.3s ease;
                }
                .step-dot.active {
                    background: #10b981;
                    box-shadow: 0 0 8px #10b981;
                }
                .step-dot.completed {
                    background: #047857;
                }
                .code-tab {
                    padding: 0.5rem 1rem;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: #9ca3af;
                }
                .code-tab.active {
                    color: #10b981;
                    border-bottom-color: #10b981;
                }
            `}</style>

            <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 10 }}>
                
                {/* Header Wizard Indicators */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>urBackend</span>
                        <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>/</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#9ca3af' }}>onboarding</span>
                    </div>
                    
                    {/* Visual indicators for steps */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={`step-dot ${isProjectStep ? 'active' : ''} ${progress.create_project ? 'completed' : ''}`} />
                        <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        <div className={`step-dot ${isCollectionStep ? 'active' : ''} ${progress.create_collection ? 'completed' : ''}`} />
                        <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        <div className={`step-dot ${isApiStep ? 'active' : ''} ${progress.make_api_call ? 'completed' : ''}`} />
                    </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* SCREEN 1: Project Creation */}
                {/* ---------------------------------------------------- */}
                {isProjectStep && (
                    <div className="flat-container">
                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1 of 3</span>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>Create your first backend</h2>
                            <p style={{ color: '#9ca3af', fontSize: '0.925rem', marginTop: '0.25rem', lineHeight: '1.5' }}>
                                Create a backend project with database, authentication and APIs in minutes.
                            </p>
                        </div>

                        {progress.create_project ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                    <CheckCircle color="#10b981" size={24} style={{ flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#10b981', display: 'block' }}>Project successfully created</strong>
                                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>You have already completed this step.</span>
                                    </div>
                                </div>
                                
                                {existingProject && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1.25rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Project Details</div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.5rem', color: '#fff' }}>{existingProject.name}</h3>
                                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>{existingProject.description || 'No description provided'}</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => navigate('/onboarding/collection')}
                                    className="btn-primary"
                                    style={{ height: '48px', marginTop: '0.5rem' }}
                                >
                                    Continue to Step 2
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.5rem' }}>Project Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="my-cool-project"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.5rem' }}>Description (optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Database container for my web app"
                                        value={projectDesc}
                                        onChange={(e) => setProjectDesc(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#d1d5db' }}>MongoDB Connection URI (optional)</label>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Pro BYOD Feature</span>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="mongodb+srv://..."
                                        value={mongoUri}
                                        onChange={(e) => setMongoUri(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="includeUsers"
                                        checked={includeUsers}
                                        onChange={(e) => setIncludeUsers(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="includeUsers" style={{ fontSize: '0.875rem', color: '#d1d5db', cursor: 'pointer', userSelect: 'none' }}>
                                        Include standard <strong>Users</strong> collection (for Authentication)
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={projectLoading}
                                    className="btn-primary"
                                    style={{ marginTop: '1rem', height: '48px' }}
                                >
                                    {projectLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Create & Continue'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 2: Collection Builder */}
                {/* ---------------------------------------------------- */}
                {isCollectionStep && (
                    <div className="flat-container">
                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 2 of 3</span>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>Create your first collection</h2>
                            <p style={{ color: '#9ca3af', fontSize: '0.925rem', marginTop: '0.25rem', lineHeight: '1.5' }}>
                                Let's create a sample collection so you can start making API calls immediately.
                            </p>
                        </div>

                        {progress.create_collection && existingProject?.collections?.some(c => c.name !== 'users') ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                    <CheckCircle color="#10b981" size={24} style={{ flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#10b981', display: 'block' }}>Collection successfully created</strong>
                                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>You have already completed this step.</span>
                                    </div>
                                </div>

                                {existingCollection && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1.25rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Collection Details</div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.5rem', color: '#fff' }}>{existingCollection.name}</h3>
                                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>{existingCollection.model?.length || 0} fields defined</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => navigate('/onboarding/api')}
                                    className="btn-primary"
                                    style={{ height: '48px', marginTop: '0.5rem' }}
                                >
                                    Continue to Step 3
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.5rem' }}>Collection Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="products, posts, orders"
                                        value={collectionName}
                                        onChange={(e) => setCollectionName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#d1d5db' }}>Schema Fields</label>
                                        <button
                                            type="button"
                                            onClick={addField}
                                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#d1d5db', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600 }}
                                        >
                                            <Plus size={12} /> Add Field
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {fields.map((field, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="field_key"
                                                    value={field.key}
                                                    onChange={(e) => handleFieldChange(idx, 'key', e.target.value)}
                                                    className="form-input"
                                                    style={{ flex: 2 }}
                                                />
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                                                    className="form-input"
                                                    style={{ flex: 1, cursor: 'pointer' }}
                                                >
                                                    {PRIMITIVE_TYPES.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '90px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`req-${idx}`}
                                                        checked={field.required}
                                                        onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                                                        style={{ cursor: 'pointer', accentColor: '#10b981' }}
                                                    />
                                                    <label htmlFor={`req-${idx}`} style={{ fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer', userSelect: 'none' }}>Required</label>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '80px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`uniq-${idx}`}
                                                        checked={field.unique}
                                                        onChange={(e) => handleFieldChange(idx, 'unique', e.target.checked)}
                                                        style={{ cursor: 'pointer', accentColor: '#10b981' }}
                                                    />
                                                    <label htmlFor={`uniq-${idx}`} style={{ fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer', userSelect: 'none' }}>Unique</label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeField(idx)}
                                                    disabled={fields.length <= 1}
                                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'none', padding: '0.65rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={collectionLoading}
                                    className="btn-primary"
                                    style={{ marginTop: '1rem', height: '48px' }}
                                >
                                    {collectionLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Create Collection & Continue'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 3: Test API */}
                {/* ---------------------------------------------------- */}
                {isApiStep && (
                    <div className="flat-container">
                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 3 of 3</span>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>Your backend is ready 🚀</h2>
                            <p style={{ color: '#9ca3af', fontSize: '0.925rem', marginTop: '0.25rem', lineHeight: '1.5' }}>
                                Let's make your first API call.
                            </p>
                        </div>

                        {keysLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <RefreshCw className="animate-spin" size={24} style={{ color: '#10b981' }} />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                
                                {/* Keys Panel */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    
                                    {/* Publishable key */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af' }}>Public Key</span>
                                            <button onClick={() => copyToClipboard(publishableKey)} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', fontWeight: 600 }}>
                                                <Copy size={12} /> Copy
                                            </button>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: '0.85rem', color: '#3ecf8e', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                            {publishableKey || 'pk_live_••••••••'}
                                        </div>
                                    </div>

                                    {/* Secret Key */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>Secret Key</span>
                                            {secretKey && revealSecret && (
                                                <button onClick={() => copyToClipboard(secretKey)} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', fontWeight: 600 }}>
                                                    <Copy size={12} /> Copy
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                            <div style={{ flex: 1, padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: revealSecret ? '#f43f5e' : '#6b7280', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                {revealSecret ? secretKey : '********************************'}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!user?.isVerified) {
                                                        setShowVerifyModal(true);
                                                    } else {
                                                        setRevealSecret(!revealSecret);
                                                    }
                                                }}
                                                style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyValues: 'center', justifyContent: 'center', height: '40px', width: '45px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
                                            >
                                                {revealSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Code Samples Tabs */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <button className={`code-tab ${activeTab === 'sdk' ? 'active' : ''}`} onClick={() => setActiveTab('sdk')}>SDK</button>
                                        <button className={`code-tab ${activeTab === 'fetch' ? 'active' : ''}`} onClick={() => setActiveTab('fetch')}>Fetch</button>
                                        <button className={`code-tab ${activeTab === 'curl' ? 'active' : ''}`} onClick={() => setActiveTab('curl')}>cURL</button>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Consolas, monospace', fontSize: '0.85rem', whiteSpace: 'pre', overflowX: 'auto', color: '#e5e7eb', lineHeight: '1.5' }}>
                                        {codeSamples[activeTab]}
                                    </div>
                                </div>

                                {/* Test request box */}
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={handleTestApi}
                                            disabled={testLoading}
                                            className="btn-primary"
                                        >
                                            {testLoading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />} Test API
                                        </button>
                                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: '1.4' }}>
                                            Trigger a live <code>GET /api/data/{collectionName}</code> with your publishable key.
                                        </span>
                                    </div>

                                    {testResponse && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af' }}>API Response</span>
                                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Consolas, monospace', fontSize: '0.85rem', overflowX: 'auto', color: testSuccess ? '#10b981' : '#f87171' }}>
                                                <pre style={{ margin: 0 }}>{JSON.stringify(testResponse, null, 2)}</pre>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Navigation footer */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                                    {!testSuccess && (
                                        <button
                                            type="button"
                                            onClick={handleFinishOnboarding}
                                            style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginRight: 'auto', textDecoration: 'underline' }}
                                        >
                                            Skip & Launch Dashboard
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleFinishOnboarding}
                                        className="btn-primary"
                                    >
                                        Launch Dashboard <Rocket size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ---------------------------------------------------- */}
                        {/* EMAIL VERIFICATION MODAL OVERLAY */}
                        {/* ---------------------------------------------------- */}
                        {showVerifyModal && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(11, 15, 25, 0.96)', borderRadius: '16px',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                padding: '2rem', zIndex: 10, textAlign: 'center',
                                backdropFilter: 'blur(8px)'
                            }}>
                                <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyValues: 'center', justifyContent: 'center', color: '#10b981' }}>
                                        <Mail size={30} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Verify your email</h3>
                                        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.55' }}>
                                            Email verification is required before revealing API keys.
                                        </p>
                                    </div>

                                    {!otpSent ? (
                                        <button
                                            onClick={triggerSendOtp}
                                            disabled={verifyLoading}
                                            className="btn-primary"
                                            style={{ width: '100%', height: '44px' }}
                                        >
                                            {verifyLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Verify Email'}
                                        </button>
                                    ) : (
                                        <form onSubmit={handleVerifyOtp} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                                Enter the 6-digit code sent to <strong>{user?.email}</strong>
                                            </p>
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                className="form-input"
                                                placeholder="000000"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}
                                            />
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    type="button"
                                                    disabled={countdown > 0 || verifyLoading}
                                                    onClick={triggerSendOtp}
                                                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    {countdown > 0 ? `Resend (${countdown}s)` : 'Resend Code'}
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={verifyLoading}
                                                    className="btn-primary"
                                                    style={{ flex: 1 }}
                                                >
                                                    {verifyLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Confirm'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.5rem 0' }} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Already verified?</span>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                await refreshUser();
                                                toast.success("Status refreshed!");
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: '#10b981', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600 }}
                                        >
                                            Refresh Status
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}
