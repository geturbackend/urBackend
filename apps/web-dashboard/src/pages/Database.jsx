import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmationModal from "./ConfirmationModal";
import AddRecordDrawer from "../components/AddRecordDrawer";
import CollectionTable from "../components/CollectionTable";
import DatabaseSidebar from "../components/DatabaseSidebar";
import RowDetailDrawer from "../components/RowDetailDrawer";
import RecordList from "../components/RecordList";
import { Database as DbIcon, FileText, Shield, X } from "lucide-react";

import DatabaseHeader from "../components/Database/DatabaseHeader";
import DatabaseFilter from "../components/Database/DatabaseFilter";
import Pagination from "../components/Database/Pagination";

export default function Database() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // Default to table for pro feel
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const [queryParams, setQueryParams] = useState({
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 50,
      sort: searchParams.get('sort') || '-createdAt',
      filters: []
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const [recoveringIds, setRecoveringIds] = useState(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [rlsEnabled, setRlsEnabled] = useState(false);
  const [rlsMode, setRlsMode] = useState("public-read");
  const [rlsOwnerField, setRlsOwnerField] = useState("userId");
  const [isRlsDialogOpen, setIsRlsDialogOpen] = useState(false);

  // ... (Keeping core logic: fetchProject, fetchData, handleSaveRls, etc. - mapped to new components)

    useEffect(() => {
      let isMounted = true;
      const fetchProject = async () => {
        try {
          const res = await api.get(`/api/projects/${projectId}`);
          const withRlsDefaults = (res.data.collections || []).map(c => ({
              ...c,
              rls: {
                enabled: typeof c.rls?.enabled === 'boolean' ? c.rls.enabled : false,
                mode: c.rls?.mode === 'owner-write-only' ? 'public-read' : (c.rls?.mode || 'public-read'),
                ownerField: c.rls?.ownerField || 'userId',
                requireAuthForWrite: typeof c.rls?.requireAuthForWrite === 'boolean' ? c.rls.requireAuthForWrite : true
              }
          }));
          if (isMounted) {
            setProject(res.data);
            setCollections(withRlsDefaults);
            const queryCol = searchParams.get("collection");
            if (queryCol) {
              const found = withRlsDefaults.find(c => c.name === queryCol);
              if (found) setActiveCollection(found);
            } else if (withRlsDefaults.length > 0) {
              setActiveCollection(withRlsDefaults.find(c => c.name !== 'users') || withRlsDefaults[0]);
            }
          }
        } catch { toast.error("Failed to load project"); }
      };
      fetchProject();
      return () => { isMounted = false; };
    }, [projectId, user, searchParams]);

    // Sync RLS states with active collection
    useEffect(() => {
      if (activeCollection) {
        Promise.resolve().then(() => {
          setRlsEnabled(activeCollection.rls?.enabled || false);
          setRlsMode(activeCollection.rls?.mode || 'public-read');
          setRlsOwnerField(activeCollection.rls?.ownerField || 'userId');
          
          // Reset filters when switching collections to prevent invalid field queries
          setQueryParams(p => ({ ...p, page: 1, filters: [] }));
        });
      }
    }, [activeCollection]);

  const fetchData = useCallback(async () => {
    if (!activeCollection) return;
    setLoadingData(true);
    try {
      let queryStr = `?page=${queryParams.page}&limit=${queryParams.limit}&sort=${queryParams.sort}`;
      if (showDeleted) {
        queryStr += `&include_deleted=true`;
      }
      queryParams.filters.forEach(f => {
         if (f.field && f.value !== '') queryStr += `&${f.field}${f.operator === '=' ? '' : f.operator}=${encodeURIComponent(f.value)}`;
      });
      const res = await api.get(`/api/projects/${projectId}/collections/${activeCollection.name}/data${queryStr}`);
      // Handle standard API response format { success, data: { items, total } }
      if (res.data?.success && res.data?.data?.items) {
        setData(res.data.data.items);
        setTotalRecords(res.data.data.total || 0);
      } 
      // Handle legacy metadata response { items, total }
      else if (res.data && res.data.items) {
        setData(res.data.items);
        setTotalRecords(res.data.total || 0);
      } 
      // Fallback
      else {
        setData(res.data || []);
        setTotalRecords(Array.isArray(res.data) ? res.data.length : 0);
      }
    } catch { toast.error("Failed to load data"); }
    finally { setLoadingData(false); }
  }, [activeCollection, projectId, queryParams, showDeleted]);

  useEffect(() => {
    if (!activeCollection) return;
    
    // Sync URL with current page and limit
    const newParams = { collection: activeCollection.name };
    if (queryParams.page > 1) newParams.page = queryParams.page;
    if (queryParams.limit !== 50) newParams.limit = queryParams.limit;
    if (queryParams.sort !== '-createdAt') newParams.sort = queryParams.sort;
    
    setSearchParams(newParams);
    
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchData();
    });
    return () => { isMounted = false; };
  }, [activeCollection, fetchData, setSearchParams, queryParams.page, queryParams.limit, queryParams.sort]);

  const handleSaveRls = async () => {
    try {
      await api.patch(`/api/projects/${projectId}/collections/${activeCollection.name}/rls`, {
        enabled: rlsEnabled, mode: rlsMode, ownerField: rlsOwnerField, requireAuthForWrite: true
      });
      toast.success("RLS settings saved");
      return true;
    } catch { toast.error("Failed to save RLS"); return false; }
  };

  /**
   * Deletes a record from the active collection.
   * @param {string} id - The ID of the record to delete.
   */
  const handleDeleteRecord = async (id) => {
    try {
      await api.delete(`/api/projects/${projectId}/collections/${activeCollection.name}/data/${id}`);
      setData(prev => prev.filter(item => item._id !== id));
      toast.success("Document deleted");
    } catch { toast.error("Failed to delete document"); }
  };

  const handleFiltersGenerated = (aiFilters, aiSort) => {
      setQueryParams(prev => ({
          ...prev,
          page: 1,
          filters: aiFilters,
          sort: aiSort || prev.sort
      }));
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCollection = async () => {
      if (!activeCollection || isExporting) return;
      setIsExporting(true);
      const toastId = toast.loading("Requesting export...");
      try {
          const res = await api.post(`/api/projects/${projectId}/collections/${activeCollection.name}/export`);
          toast.success(res.data.message || "Export initiated! Check your email.", { id: toastId, duration: 6000 });
      } catch (err) {
          const errMsg = err.response?.data?.message || err.response?.data?.error || "Failed to export collection";
          toast.error(errMsg, { id: toastId });
      } finally {
          setIsExporting(false);
      }
  };

  /**
   * Restores a soft-deleted record from the trash for the active collection.
   * @param {string} id - The ID of the record to recover.
   */
  const handleRecoverRecord = async (id) => {
    const originalRecord = data.find(item => item._id === id);
    if (!originalRecord) return;

    setRecoveringIds(prev => new Set(prev).add(id));
    
    // Optimistic Update: clear isDeleted flag locally
    setData(prev => prev.map(item => 
      item._id === id ? { ...item, isDeleted: false, deletedAt: null } : item
    ));

    try {
      await api.patch(`/api/projects/${projectId}/collections/${activeCollection.name}/data/${id}/recover`);
      toast.success("Document restored successfully");
    } catch (err) {
      // Rollback to original state on failure
      setData(prev => prev.map(item => 
        item._id === id ? originalRecord : item
      ));
      
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error(errMsg ? `Failed to restore document: ${errMsg}` : "Failed to restore document");
    } finally {
      setRecoveringIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /**
   * Generates an RLS-aware cURL snippet for the active collection.
   * Uses the secret key if RLS is disabled, or the publishable key with a JWT if RLS is enabled.
   * @returns {string} The cURL command snippet
   */
  const getCurlSnippet = () => {
    if (!activeCollection) return '';
    return activeCollection.rls?.enabled
      ? `curl -X POST https://api.urbackend.com/api/data/${activeCollection.name} \\\n  -H "x-api-key: <YOUR_PUBLISHABLE_KEY>" \\\n  -H "Authorization: Bearer <USER_JWT>" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`
      : `curl -X POST https://api.urbackend.com/api/data/${activeCollection.name} \\\n  -H "x-api-key: <YOUR_SECRET_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
  };

  return (
    <div className="db-layout" style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', background: 'var(--color-bg-main)' }}>
      <DatabaseSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        // Filter out 'users' collection from database sidebar
        collections={collections.filter(c => c.name !== 'users')}
        activeCollection={activeCollection}
        setActiveCollection={setActiveCollection}
        project={project}
        navigate={navigate}
        projectId={projectId}
        onRequestDelete={setCollectionToDelete}
      />

      <main className="db-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '12px 12px 12px 0', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-card)' }}>
        {activeCollection ? (
          <>
            <DatabaseHeader 
              project={project}
              activeCollection={activeCollection}
              dataLength={data.length}
              viewMode={viewMode}
              setViewMode={setViewMode}
              showFilterMenu={showFilterMenu}
              setShowFilterMenu={setShowFilterMenu}
              filtersCount={queryParams.filters.length}
              onRefresh={fetchData}
              onRlsClick={() => setIsRlsDialogOpen(true)}
              onAddRecord={() => {
                if (activeCollection?.name === 'users') {
                  toast.error('Use the Auth page to add/manage users.');
                  return;
                }
                setIsAddModalOpen(true);
              }}
              onExport={handleExportCollection}
              isExporting={isExporting}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              showDeleted={showDeleted}
              setShowDeleted={setShowDeleted}
              onFiltersGenerated={handleFiltersGenerated}
            />

            <div className="db-content" style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {showFilterMenu && (
                <DatabaseFilter 
                  queryParams={queryParams}
                  setQueryParams={setQueryParams}
                  activeCollection={activeCollection}
                  onClose={() => setShowFilterMenu(false)}
                />
              )}

              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {loadingData ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }} className="spinner"></div>
                ) : data.length === 0 ? (
                  <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '2.5rem', background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--color-border)', borderRadius: '12px', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
                        <FileText size={40} style={{ opacity: 0.4, marginBottom: '1rem', display: 'inline-block' }} />
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>No records found</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Your collection is empty. You can add a record manually or make your first API call!
                        </p>
                        
                        <div style={{ background: '#111', padding: '1rem', borderRadius: '8px', textAlign: 'left', border: '1px solid var(--color-border)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                <span>Example POST Request</span>
                                <button 
                                    onClick={async () => { 
                                        try {
                                            await navigator.clipboard.writeText(getCurlSnippet()); 
                                            toast.success('Snippet copied!'); 
                                        } catch {
                                            toast.error('Failed to copy snippet');
                                        }
                                    }} 
                                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
                                >
                                    Copy
                                </button>
                            </div>
                            {activeCollection?.rls?.enabled ? (
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
<span style={{ color: '#f59e0b' }}>curl</span> -X POST https://api.urbackend.com/api/data/{activeCollection.name} \
  -H <span style={{ color: '#10b981' }}>"x-api-key: &lt;YOUR_PUBLISHABLE_KEY&gt;"</span> \
  -H <span style={{ color: '#10b981' }}>"Authorization: Bearer &lt;USER_JWT&gt;"</span> \
  -H <span style={{ color: '#10b981' }}>"Content-Type: application/json"</span> \
  -d <span style={{ color: '#10b981' }}>'&#123;&#125;'</span>
                            </pre>
                            ) : (
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
<span style={{ color: '#f59e0b' }}>curl</span> -X POST https://api.urbackend.com/api/data/{activeCollection.name} \
  -H <span style={{ color: '#10b981' }}>"x-api-key: &lt;YOUR_SECRET_KEY&gt;"</span> \
  -H <span style={{ color: '#10b981' }}>"Content-Type: application/json"</span> \
  -d <span style={{ color: '#10b981' }}>'&#123;&#125;'</span>
                            </pre>
                            )}
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>Add Record Manually</button>
                        </div>
                    </div>
                  </div>
                ) : viewMode === "list" ? (
                  <RecordList 
                    data={data} 
                    activeCollection={activeCollection} 
                    onView={setSelectedRecord} 
                    onRecover={handleRecoverRecord}
                    recoveringIds={recoveringIds}
                  />
                ) : viewMode === "table" ? (
                  <CollectionTable 
                    data={data} 
                    activeCollection={activeCollection} 
                    onDelete={(id) => { setSelectedId(id); setShowModal(true); }} 
                    onView={setSelectedRecord} 
                    onEdit={(rec) => { if (activeCollection?.name === 'users') return; setEditingRecord(rec); setIsAddModalOpen(true); }} 
                    onRecover={handleRecoverRecord}
                    recoveringIds={recoveringIds}
                  />
                ) : (
                  <div style={{ height: '100%', overflow: 'auto', padding: '1.5rem', background: '#050505', color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                  </div>
                )}
              </div>

              <Pagination 
                total={totalRecords}
                page={queryParams.page}
                limit={queryParams.limit}
                onPageChange={(p) => setQueryParams(prev => ({ ...prev, page: p }))}
                onLimitChange={(l) => setQueryParams(prev => ({ ...prev, limit: l, page: 1 }))}
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-card)', padding: '2rem' }}>
            <DbIcon size={64} style={{ opacity: 0.2, marginBottom: '1.5rem' }} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>No collections found</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>
              Collections (or Tables) are where your project's data is stored. Create your first collection to start saving data.
            </p>
            <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }} onClick={() => navigate(`/project/${projectId}/create-collection`)}>
              Create Collection
            </button>
          </div>
        )}
      </main>

      <RowDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        fields={activeCollection?.model || []}
        onEdit={(activeCollection?.name === 'users' || selectedRecord?.isDeleted) ? null : (rec) => { setEditingRecord(rec); setIsAddModalOpen(true); }}
      />
      
      {isAddModalOpen && (
        <AddRecordDrawer
          isOpen={true}
          onClose={() => { setIsAddModalOpen(false); setEditingRecord(null); }}
          onSubmit={async (val) => {
            try {
              if (editingRecord) await api.patch(`/api/projects/${projectId}/collections/${activeCollection.name}/data/${editingRecord._id}`, val);
              else await api.post(`/api/projects/${projectId}/collections/${activeCollection.name}/data`, val);
              toast.success("Success"); setIsAddModalOpen(false); fetchData();
            } catch { toast.error("Error saving"); }
          }}
          fields={activeCollection?.model || []}
          initialData={editingRecord}
        />
      )}

      {/* Confirmation Modals */}
      {showModal && <ConfirmationModal open={showModal} title="Delete Record" message="Confirm delete?" onConfirm={() => { handleDeleteRecord(selectedId); setShowModal(false); }} onCancel={() => setShowModal(false)} />}
      {collectionToDelete && <ConfirmationModal open={!!collectionToDelete} title="Delete Collection" message={`Delete ${collectionToDelete.name}?`} onConfirm={async () => { await api.delete(`/api/projects/${projectId}/collections/${collectionToDelete.name}`); setCollections(c => c.filter(x => x.name !== collectionToDelete.name)); setCollectionToDelete(null); }} onCancel={() => setCollectionToDelete(null)} />}

      {/* RLS Dialog */}
      {isRlsDialogOpen && (
        <div className="rls-dialog-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-card" style={{ width: '480px', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={20} color="var(--color-primary)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Row Level Security (RLS)</h3>
                </div>
                <button 
                  onClick={() => setIsRlsDialogOpen(false)} 
                  className="btn-icon" 
                  style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '6px' }}
                >
                    <X size={18} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      style={{ width: '18px', height: '18px' }}
                      checked={rlsEnabled} 
                      onChange={e => setRlsEnabled(e.target.checked)} 
                    /> 
                    Enable Rules for "{activeCollection?.name}"
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px', marginLeft: '28px' }}>
                      When enabled, access to data is restricted based on the rules below.
                  </p>
              </div>

              {rlsEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="fade-in">
                      <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Security Mode</label>
                          <select 
                            className="input-field" 
                            value={rlsMode} 
                            onChange={e => setRlsMode(e.target.value)} 
                            style={{ width: '100%', height: '40px', fontSize: '0.85rem' }}
                          >
                            <option value="public-read">Public Read (Anyone can read, Owner can write)</option>
                            <option value="private">Private (Only Owner can read and write)</option>
                          </select>
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                              {rlsMode === 'public-read' 
                                ? '✓ Perfect for public content like blog posts or reviews. Users can read anything but only edit their own data.' 
                                : '✓ Perfect for sensitive data like user profiles or personal notes. Only the creator can access the record.'}
                          </p>
                      </div>

                      <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Ownership Field</label>
                          <select 
                            className="input-field" 
                            value={rlsOwnerField} 
                            onChange={e => setRlsOwnerField(e.target.value)} 
                            style={{ width: '100%', height: '40px', fontSize: '0.85rem' }}
                          >
                              <option value="userId">userId (Default)</option>
                                {activeCollection?.model
                                  ?.filter(f => String(f?.type || '').toLowerCase() === 'string' && String(f?.key || '').toLowerCase() !== 'userid')
                                  .map(f => (
                                    <option key={f.key} value={f.key}>{f.key}</option>
                                ))}
                          </select>
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                              The field in your document that stores the creator's user ID.
                          </p>
                      </div>
                  </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, height: '42px' }} 
                    onClick={() => setIsRlsDialogOpen(false)}
                  >
                      Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 2, height: '42px' }} 
                    onClick={async () => { 
                        if (await handleSaveRls()) setIsRlsDialogOpen(false); 
                    }}
                  >
                      Save Security Rules
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
