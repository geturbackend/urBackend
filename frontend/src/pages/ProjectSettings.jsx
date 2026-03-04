import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Trash2, AlertTriangle, Save, CheckCircle, Copy, Server, Globe, Plus, X } from "lucide-react";
import { API_URL } from "../config";
import ConfirmationModal from "./ConfirmationModal";

export default function ProjectSettings() {
  const { projectId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  // Used to control the Confirmation modal visibility
  const [showModal, setShowModal] = useState(false);

  // Existing State
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // --- NEW STATE FOR RENAME ---
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(res.data);
        // Set initial name for renaming
        setNewName(res.data.name);
      } catch {
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, token]);

  // --- NEW: HANDLE RENAME ---
  const handleRename = async () => {
    if (!newName.trim()) return toast.error("Project name cannot be empty");

    setRenaming(true);
    try {
      await axios.patch(
        `${API_URL}/api/projects/${projectId}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Project renamed successfully!");
      // Update local state to reflect change immediately
      setProject((prev) => ({ ...prev, name: newName }));
    } catch {
      toast.error("Failed to rename project");
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirm !== project.name)
      return toast.error("Project name does not match");

    // // if (
    // //   !confirm("Final warning: This will delete the project and all its data.")
    // // )
    //   return;

    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Project deleted");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div
      className="container"
      style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "4rem" }}
    >
      <div
        className="page-header"
        style={{ marginBottom: "2.5rem", borderBottom: "none" }}
      >
        <div>
          <h1
            className="page-title"
            style={{
              fontSize: "2rem",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Save size={28} color="var(--color-primary)" /> Project Settings
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Configuration and preferences for <strong>{project?.name}</strong>.
          </p>
        </div>
      </div>

      {/* General Settings (Rename Feature) */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            marginBottom: "1.5rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "24px",
              background: "var(--color-primary)",
              borderRadius: "4px",
            }}
          ></div>
          General Information
        </h3>
        <div
          className="form-group"
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "250px" }}>
            <label
              className="form-label"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.9rem",
                color: "var(--color-text-muted)",
              }}
            >
              Project Name
            </label>
            <input
              type="text"
              className="input-field"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
          </div>
          <button
            onClick={handleRename}
            className="btn btn-primary"
            disabled={renaming || newName === project?.name}
            style={{ padding: "12px 24px", height: "45px" }}
          >
            {renaming ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* External Configuration */}
      <div style={{ display: "grid", gap: "2rem", marginBottom: "2rem" }}>
        <AllowedDomainsForm
          project={project}
          projectId={projectId}
          token={token}
          onProjectUpdate={setProject}
        />
        <DatabaseConfigForm
          project={project}
          projectId={projectId}
          token={token}
          onProjectUpdate={setProject}
        />
        <StorageConfigForm
          project={project}
          projectId={projectId}
          token={token}
          onProjectUpdate={setProject}
        />
      </div>

      {/* Danger Zone */}
      <div
        className="card"
        style={{
          border: "1px solid rgba(234, 84, 85, 0.3)",
          background: "rgba(234, 84, 85, 0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "1.5rem",
            color: "#ea5455",
          }}
        >
          <AlertTriangle size={24} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Danger Zone</h3>
        </div>

        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            lineHeight: "1.6",
          }}
        >
          This action cannot be undone. This will permanently delete the
          <strong style={{ color: "#fff" }}> {project?.name}</strong> project
          and all associated data including collections, files, and users.
        </p>

        <div style={{ maxWidth: "500px" }}>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label
              className="form-label"
              style={{
                color: "#ea5455",
                fontWeight: 500,
                marginBottom: "8px",
                display: "block",
              }}
            >
              Type{" "}
              <strong style={{ textDecoration: "underline" }}>
                {project?.name}
              </strong>{" "}
              to confirm
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={project?.name}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--color-bg-input)",
                border: "1px solid rgba(234, 84, 85, 0.3)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
          </div>

          <button
            onClick={() => {
              setShowModal(true);
            }}
            className="btn btn-danger"
            disabled={deleteConfirm !== project?.name}
            style={{
              width: "100%",
              justifyContent: "center",
              background: "#ea5455",
              border: "none",
              color: "#fff",
              padding: "12px",
              borderRadius: "8px",
              marginTop: "10px",
            }}
          >
            <Trash2 size={18} /> Permanently Delete Project
          </button>
          {showModal && (
            <ConfirmationModal
              open={showModal}
              title="Delete Project"
              message="Are you sure you want to delete this project? This action cannot be undone."
              onConfirm={() => {
                handleDeleteProject();
                setShowModal(false);
              }}
              onCancel={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DatabaseConfigForm({ project, projectId, token, onProjectUpdate }) {
  const [dbUri, setDbUri] = useState("");
  const [loading, setLoading] = useState(false);
  // Use optional chaining carefully - project might be null initially
  const isConfigured = project?.resources?.db?.isExternal || false;
  const [showForm, setShowForm] = useState(!isConfigured);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [serverIp, setServerIp] = useState(null);

  useEffect(() => {
    const configured = project?.resources?.db?.isExternal || false;
    setShowForm(!configured);

    // Fetch Server IP
    const fetchIp = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/server-ip`);
        setServerIp(res.data.ip);
      } catch (e) {
        console.error("Failed to fetch server IP", e);
      }
    };
    fetchIp();
  }, [project]);

  const copyIp = () => {
    if (serverIp) {
      navigator.clipboard.writeText(serverIp);
      toast.success("Server IP copied!");
    }
  };

  const handleUpdate = async () => {
    if (!dbUri) return toast.error("Database URI is required");

    setLoading(true);
    try {
      await axios.patch(
        `${API_URL}/api/projects/${projectId}/byod-config`,
        { dbUri },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Database configuration updated!");
      setShowForm(false);
      setDbUri("");
      // Typically we'd reload project data here, but for now we rely on user refresh or optimistic ui if needed
      // Ideally notify parent to refresh project, but basic flow:
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update DB config";

      if (errorMsg.includes("whitelist Server IP")) {
        toast.error(
          <div>
            <b>Access Denied!</b>
            <br />
            {errorMsg}
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    // Replaced window.confirm with modal state trigger
    setShowRemoveModal(true);
  };

  const executeRemove = async () => {
    try {
      await axios.delete(
        `${API_URL}/api/projects/${projectId}/byod-config/db`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { projectId }
        }
      );
      toast.success("External database configuration removed!");

      onProjectUpdate(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          db: { ...prev.resources.db, isExternal: false }
        }
      }));
      setShowForm(true);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to remove DB config");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      {showRemoveModal && (
        <ConfirmationModal
          open={showRemoveModal}
          title="Remove Database Config"
          message="Are you sure you want to remove the external database configuration? This will switch back to the internal database."
          onConfirm={() => {
            executeRemove();
            setShowRemoveModal(false);
          }}
          onCancel={() => setShowRemoveModal(false)}
        />
      )}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: "var(--color-primary)",
        }}
      ></div>

      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Save size={20} color="var(--color-primary)" /> Database Configuration
          (MongoDB)
        </h3>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.9rem",
            marginTop: "5px",
          }}
        >
          Connect your own MongoDB cluster.
        </p>
      </div>

      {isConfigured && !showForm ? (
        <div
          style={{
            marginTop: "1rem",
            background: "rgba(16, 185, 129, 0.1)",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#10B981",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            <CheckCircle size={18} />
            Connected
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowForm(true)}
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            >
              Update URI
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleRemove}
              disabled={loading}
              style={{
                background: 'rgba(234, 84, 85, 0.1)',
                color: '#ea5455',
                border: '1px solid rgba(234, 84, 85, 0.2)'
              }}
            >
              {loading ? "Removing..." : "Remove Config"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          <div className="form-group">
            <label
              className="form-label"
              style={{
                marginBottom: "8px",
                display: "block",
                fontSize: "0.9rem",
              }}
            >
              MongoDB Connection URI
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/..."
              value={dbUri}
              onChange={(e) => setDbUri(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "#fff",
                fontFamily: "monospace",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <Server size={14} />
              <span>Server Public IP: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{serverIp || "Loading..."}</code></span>
              {serverIp && (
                <button
                  onClick={copyIp}
                  className="btn-icon"
                  title="Copy IP"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', padding: 0, marginLeft: '5px' }}
                >
                  <Copy size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {isConfigured && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleUpdate}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Connect Database"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StorageConfigForm({ project, projectId, token, onProjectUpdate }) {
  const [config, setConfig] = useState({
    storageUrl: "",
    storageKey: "",
    storageProvider: "supabase",
  });
  const [loading, setLoading] = useState(false);
  const isConfigured = project?.resources?.storage?.isExternal || false;
  const [showForm, setShowForm] = useState(!isConfigured);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  useEffect(() => {
    const configured = project?.resources?.storage?.isExternal || false;
    setShowForm(!configured);
  }, [project]);

  const handleChange = (e) =>
    setConfig({ ...config, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    if (!config.storageUrl || !config.storageKey)
      return toast.error("URL and Key are required");

    setLoading(true);
    try {
      await axios.patch(
        `${API_URL}/api/projects/${projectId}/byod-config`,
        config,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Storage configuration updated!");
      setShowForm(false);
      setConfig({
        storageUrl: "",
        storageKey: "",
        storageProvider: "supabase",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to update Storage config"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    // Replaced window.confirm with modal state trigger
    setShowRemoveModal(true);
  };

  const executeRemove = async () => {
    try {
      await axios.delete(
        `${API_URL}/api/projects/${projectId}/byod-config/storage`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { projectId }
        }
      );
      toast.success("External storage configuration removed!");

      onProjectUpdate(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          storage: { ...prev.resources.storage, isExternal: false }
        }
      }));
      setConfig({
        storageUrl: "",
        storageKey: "",
        storageProvider: "supabase",
      });
      setShowForm(true);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to remove Storage config");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      {showRemoveModal && (
        <ConfirmationModal
          open={showRemoveModal}
          title="Remove Storage Config"
          message="Are you sure you want to remove the external storage configuration? This will switch back to the internal storage."
          onConfirm={() => {
            executeRemove();
            setShowRemoveModal(false);
          }}
          onCancel={() => setShowRemoveModal(false)}
        />
      )}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: "#34d399",
        }}
      ></div>

      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Save size={20} color="#34d399" /> Storage Configuration
        </h3>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.9rem",
            marginTop: "5px",
          }}
        >
          Connect your own S3-compatible storage.
        </p>
      </div>

      {isConfigured && !showForm ? (
        <div
          style={{
            marginTop: "1rem",
            background: "rgba(16, 185, 129, 0.1)",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#10B981",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            <CheckCircle size={18} />
            Connected
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowForm(true)}
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            >
              Update Config
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleRemove}
              disabled={loading}
              style={{
                background: 'rgba(234, 84, 85, 0.1)',
                color: '#ea5455',
                border: '1px solid rgba(234, 84, 85, 0.2)'
              }}
            >
              {loading ? "Removing..." : "Remove Config"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "1rem", display: "grid", gap: "1.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  marginBottom: "8px",
                  display: "block",
                  fontSize: "0.9rem",
                }}
              >
                Storage URL
              </label>
              <input
                type="text"
                name="storageUrl"
                className="input-field"
                value={config.storageUrl}
                onChange={handleChange}
                placeholder="https://..."
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--color-bg-input)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
            </div>
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  marginBottom: "8px",
                  display: "block",
                  fontSize: "0.9rem",
                }}
              >
                Provider
              </label>
              <select
                name="storageProvider"
                className="input-field"
                value={config.storageProvider}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--color-bg-input)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              >
                <option value="supabase">Supabase</option>
                <option value="aws" disabled>
                  AWS S3 (Coming Soon)
                </option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label
              className="form-label"
              style={{
                marginBottom: "8px",
                display: "block",
                fontSize: "0.9rem",
              }}
            >
              Storage Key / Service Role
            </label>
            <input
              type="password"
              name="storageKey"
              className="input-field"
              value={config.storageKey}
              onChange={handleChange}
              placeholder="Key..."
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "#fff",
                fontFamily: "monospace",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "1rem",
            }}
          >
            {isConfigured && (
              <button
                className="btn btn-ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleUpdate}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Connect Storage"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AllowedDomainsForm({ project, projectId, token, onProjectUpdate }) {
  const [domains, setDomains] = useState(project?.allowedDomains || []);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project?.allowedDomains) {
      setDomains(project.allowedDomains);
    }
  }, [project]);

  const handleUpdate = async (updatedDomains) => {
    setLoading(true);
    try {
      await axios.patch(
        `${API_URL}/api/projects/${projectId}/allowed-domains`,
        { domains: updatedDomains },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Allowed domains updated!");
      setDomains(updatedDomains);
      onProjectUpdate((prev) => ({ ...prev, allowedDomains: updatedDomains }));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update allowed domains");
    } finally {
      setLoading(false);
    }
  };

  const addDomain = () => {
    const domain = newDomain.trim();
    if (!domain) return;
    
    // basic validation
    if (domains.includes(domain)) {
      return toast.error("Domain already added");
    }

    const updated = [...domains, domain];
    handleUpdate(updated);
    setNewDomain("");
  };

  const removeDomain = (domainToRemove) => {
    const updated = domains.filter((d) => d !== domainToRemove);
    handleUpdate(updated);
  };

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: "#6366f1",
        }}
      ></div>

      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Globe size={20} color="#6366f1" /> Allowed Domains (CORS)
        </h3>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.9rem",
            marginTop: "5px",
            lineHeight: "1.5"
          }}
        >
          Restrict which websites can use your <strong>Publishable API Key</strong>. 
          Use <code>*</code> to allow all domains, or specify domains like <code>https://example.com</code> or <code>*.example.com</code>.
        </p>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., https://mywebsite.com or *.mywebsite.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDomain();
              }
            }}
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <button
            onClick={addDomain}
            className="btn btn-secondary"
            disabled={loading || !newDomain.trim()}
            style={{ padding: "0 16px", height: "auto" }}
          >
            <Plus size={18} /> Add
          </button>
        </div>

        {domains.length === 0 ? (
          <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
            No domains configured. Your publishable key won't work on the web until you add <code>*</code> or specific domains.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {domains.map((domain) => (
              <li
                key={domain}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  fontSize: "0.95rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {domain === "*" ? (
                    <span style={{ color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                       <AlertTriangle size={14} color="#10b981" /> ALLOW ALL (*)
                    </span>
                  ) : (
                    <span style={{ fontFamily: "monospace" }}>{domain}</span>
                  )}
                </div>
                <button
                  onClick={() => removeDomain(domain)}
                  disabled={loading}
                  aria-label="Remove domain"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = "#ea5455"}
                  onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
