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
import { Database as DbIcon, FileText, Shield, X, Copy } from "lucide-react";
import { PUBLIC_API_URL } from '../config';

import DatabaseHeader from "../components/Database/DatabaseHeader";
import DatabaseFilter from "../components/Database/DatabaseFilter";
import Pagination from "../components/Database/Pagination";
import SchemaCanvasViewer from "../components/SchemaCanvasViewer";

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
  const [viewMode, setViewMode] = useState("table");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const myMember = project?.members?.find(m => m.user === user?._id || m.email === user?.email);
  const myRole = project?.owner === user?._id ? 'owner' : (myMember?.role || 'viewer');
  const isViewer = myRole === 'viewer';

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
  const [loadingProject, setLoadingProject] = useState(true);

  const handleSelectCollection = useCallback((col) => {
    setActiveCollection(col);
    setQueryParams(prev => ({ ...prev, page: 1, filters: [] }));
  }, []);

  const handleOpenRlsDialog = () => {
    if (!activeCollection) return;
    setRlsEnabled(activeCollection.rls?.enabled || false);
    setRlsMode(activeCollection.rls?.mode || 'public-read');
    setRlsOwnerField(activeCollection.rls?.ownerField || 'userId');
    setIsRlsDialogOpen(true);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProject = async () => {
      try {
        const res = await api.get(`/api/projects/${projectId}`);
        const projectData = res.data?.data || res.data;
        const withRlsDefaults = (projectData?.collections || []).map(c => ({
            ...c,
            rls: {
              enabled: typeof c.rls?.enabled === 'boolean' ? c.rls.enabled : false,
              mode: c.rls?.mode === 'owner-write-only' ? 'public-read' : (c.rls?.mode || 'public-read'),
              ownerField: c.rls?.ownerField || 'userId',
              requireAuthForWrite: typeof c.rls?.requireAuthForWrite === 'boolean' ? c.rls.requireAuthForWrite : true
            }
        }));
        if (isMounted) {
          setProject(projectData);
          setCollections(withRlsDefaults);
          const queryCol = searchParams.get("collection");
          if (queryCol) {
            const found = withRlsDefaults.find(c => c.name === queryCol);
            if (found) setActiveCollection(found);
          } else if (withRlsDefaults.length > 0) {
            setActiveCollection(withRlsDefaults.find(c => c.name !== 'users') || withRlsDefaults[0]);
          }
        }
      } catch { 
        toast.error("Failed to load project"); 
      } finally {
        if (isMounted) setLoadingProject(false);
      }
    };
    fetchProject();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user]);

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
      if (res.data?.success && res.data?.data?.items) {
        setData(res.data.data.items);
        setTotalRecords(res.data.data.total || 0);
      } else if (res.data && res.data.items) {
        setData(res.data.items);
        setTotalRecords(res.data.total || 0);
      } else {
        setData(res.data || []);
        setTotalRecords(Array.isArray(res.data) ? res.data.length : 0);
      }
    } catch { toast.error("Failed to load data"); }
    finally { setLoadingData(false); }
  }, [activeCollection, projectId, queryParams, showDeleted]);

  useEffect(() => {
    if (!activeCollection) return;
    
    const newParams = { collection: activeCollection.name };
    if (queryParams.page > 1) newParams.page = queryParams.page;
    if (queryParams.limit !== 50) newParams.limit = queryParams.limit;
    if (queryParams.sort !== '-createdAt') newParams.sort = queryParams.sort;
    
    setSearchParams(newParams, { replace: true });
    
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

  const handleDeleteRecord = async (id, isPermanent) => {
    try {
      await api.delete(`/api/projects/${projectId}/collections/${activeCollection.name}/data/${id}${isPermanent ? '?permanent=true' : ''}`);
      if (isPermanent || !showDeleted) {
        setData(prev => prev.filter(item => item._id !== id));
      } else {
        setData(prev => prev.map(item => item._id === id ? { ...item, isDeleted: true, deletedAt: new Date().toISOString() } : item));
      }
      toast.success(isPermanent ? "Document permanently deleted" : "Document deleted");
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

  const handleRecoverRecord = async (id) => {
    const originalRecord = data.find(item => item._id === id);
    if (!originalRecord) return;

    setRecoveringIds(prev => new Set(prev).add(id));
    
    setData(prev => prev.map(item => 
      item._id === id ? { ...item, isDeleted: false, deletedAt: null } : item
    ));

    try {
      await api.patch(`/api/projects/${projectId}/collections/${activeCollection.name}/data/${id}/recover`);
      toast.success("Document restored successfully");
    } catch (err) {
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

  const getCurlSnippet = () => {
    if (!activeCollection) return '';
    return activeCollection.rls?.enabled
      ? `curl -X POST ${PUBLIC_API_URL}/api/data/${activeCollection.name} \\\n  -H "x-api-key: <YOUR_PUBLISHABLE_KEY>" \\\n  -H "Authorization: Bearer <USER_JWT>" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`
      : `curl -X POST ${PUBLIC_API_URL}/api/data/${activeCollection.name} \\\n  -H "x-api-key: <YOUR_SECRET_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
  };

  if (loadingProject) {
    return (
      <div className="db-layout" style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', background: 'var(--color-bg-main)', overflow: 'hidden' }}>
        <aside className="db-sidebar" style={{ background: 'var(--color-bg-sidebar)', borderRight: '1px solid var(--color-border)', width: '230px', minWidth: '230px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '1rem', borderRadius: '4px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ width: '90%', height: '22px', borderRadius: '4px' }} />
            ))}
          </div>
        </aside>

        <main className="db-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-card)', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="skeleton" style={{ width: '100px', height: '18px', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <div className="skeleton" style={{ width: '100px', height: '28px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '70px', height: '28px', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div className="skeleton" style={{ width: '100%', height: '32px', borderRadius: '4px' }} />
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ width: '100%', height: '28px', borderRadius: '4px' }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="db-layout" style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', background: 'var(--color-bg-main)', overflow: 'hidden' }}>
      <DatabaseSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        collections={collections.filter(c => c.name !== 'users')}
        activeCollection={activeCollection}
        setActiveCollection={handleSelectCollection}
        project={project}
        navigate={navigate}
        projectId={projectId}
        onRequestDelete={setCollectionToDelete}
        isViewer={isViewer}
      />

      <main className="db-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: 'var(--color-bg-card)' }}>
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
              onRlsClick={handleOpenRlsDialog}
              onEditSchemaClick={() => navigate(`/project/${projectId}/edit-collection/${activeCollection.name}`)}
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
              isViewer={isViewer}
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
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div className="spinner"></div>
                  </div>
                ) : data.length === 0 ? (
                  <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--color-bg-card)', border: '1px dashed var(--color-border)', borderRadius: '8px', textAlign: 'center', maxWidth: '520px', width: '100%' }}>
                        <FileText size={32} style={{ opacity: 0.3, marginBottom: '0.75rem', display: 'inline-block', color: 'var(--color-primary)' }} />
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem', fontWeight: 600, color: 'var(--color-text-main)' }}>No records found</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
                            Collection is empty. Insert a record or make an API request.
                        </p>
                        
                        <div style={{ background: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: '6px', textAlign: 'left', border: '1px solid var(--color-border)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
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
                                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}
                                >
                                    <Copy size={11} /> Copy
                                </button>
                            </div>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-main)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{getCurlSnippet()}
                            </pre>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            {!isViewer && (
                                <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.775rem' }} onClick={() => setIsAddModalOpen(true)}>Add Record Manually</button>
                            )}
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
                    isViewer={isViewer}
                  />
                ) : viewMode === "table" ? (
                  <CollectionTable 
                    data={data} 
                    activeCollection={activeCollection} 
                    onDelete={(id, isPermanent) => { setSelectedId(id); setIsPermanentDelete(isPermanent); setShowModal(true); }} 
                    onView={setSelectedRecord} 
                    onEdit={(rec) => { if (activeCollection?.name === 'users') return; setEditingRecord(rec); setIsAddModalOpen(true); }} 
                    onRecover={handleRecoverRecord}
                    recoveringIds={recoveringIds}
                    isViewer={isViewer}
                  />
                ) : viewMode === "canvas" ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-main)' }}>
                    <SchemaCanvasViewer 
                      schema={collections.filter(c => c.name !== 'users').map(c => ({
                        collection: c.name,
                        fields: (c.model || []).map(f => ({ ...f, name: f.key }))
                      }))}
                      messages={[]}
                      readOnly={true}
                    />
                  </div>
                ) : (
                  <div style={{ height: '100%', overflow: 'auto', padding: '1rem', background: 'var(--color-bg-input)', color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-card)', padding: '1.5rem' }}>
            <DbIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-main)' }}>No collections found</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem', maxWidth: '340px', textAlign: 'center', lineHeight: '1.4' }}>
              {isViewer ? 'The project owner has not created any collections yet.' : 'Create your first collection to start saving data.'}
            </p>
            {!isViewer && (
              <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.825rem' }} onClick={() => navigate(`/project/${projectId}/create-collection`)}>
                Create Collection
              </button>
            )}
          </div>
        )}
      </main>

      <RowDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        fields={activeCollection?.model || []}
        onEdit={(activeCollection?.name === 'users' || selectedRecord?.isDeleted || isViewer) ? null : (rec) => { setEditingRecord(rec); setIsAddModalOpen(true); }}
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
      {showModal && <ConfirmationModal open={showModal} title={isPermanentDelete ? "Permanently Delete Record" : "Delete Record"} message={isPermanentDelete ? "This action cannot be undone. Confirm permanent delete?" : "Confirm delete?"} onConfirm={() => { handleDeleteRecord(selectedId, isPermanentDelete); setShowModal(false); }} onCancel={() => setShowModal(false)} />}
      {collectionToDelete && <ConfirmationModal open={!!collectionToDelete} title="Delete Collection" message={`Delete ${collectionToDelete.name}?`} onConfirm={async () => { await api.delete(`/api/projects/${projectId}/collections/${collectionToDelete.name}`); setCollections(c => c.filter(x => x.name !== collectionToDelete.name)); setCollectionToDelete(null); }} onCancel={() => setCollectionToDelete(null)} />}

      {/* RLS Dialog */}
      {isRlsDialogOpen && (
        <div className="rls-dialog-overlay" style={{ position: 'fixed', inset: 0, background: 'var(--color-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ width: '420px', maxWidth: '90vw', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={18} color="var(--color-primary)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>Row Level Security (RLS)</h3>
                </div>
                <button 
                  onClick={() => setIsRlsDialogOpen(false)} 
                  className="btn-icon" 
                  style={{ borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <X size={15} />
                </button>
            </div>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '10px', background: 'var(--color-bg-input)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-main)' }}>
                    <input 
                      type="checkbox" 
                      style={{ width: '16px', height: '16px' }}
                      checked={rlsEnabled} 
                      onChange={e => setRlsEnabled(e.target.checked)} 
                    /> 
                    Enable Rules for "{activeCollection?.name}"
                  </label>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', marginLeft: '24px' }}>
                      When enabled, access to data is restricted based on the rules below.
                  </p>
              </div>

              {rlsEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Security Mode</label>
                          <select 
                            className="input-field" 
                            value={rlsMode} 
                            onChange={e => setRlsMode(e.target.value)} 
                            style={{ width: '100%', height: '32px', fontSize: '0.775rem' }}
                          >
                            <option value="public-read">Public Read (Anyone can read, Owner can write)</option>
                            <option value="private">Private (Only Owner can read and write)</option>
                          </select>
                      </div>

                      <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Ownership Field</label>
                          <select 
                            className="input-field" 
                            value={rlsOwnerField} 
                            onChange={e => setRlsOwnerField(e.target.value)} 
                            style={{ width: '100%', height: '32px', fontSize: '0.775rem' }}
                          >
                              <option value="userId">userId (Default)</option>
                                {activeCollection?.model
                                  ?.filter(f => String(f?.type || '').toLowerCase() === 'string' && String(f?.key || '').toLowerCase() !== 'userid')
                                  .map(f => (
                                    <option key={f.key} value={f.key}>{f.key}</option>
                                ))}
                          </select>
                      </div>
                  </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.25rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, height: '32px', fontSize: '0.75rem' }} 
                    onClick={() => setIsRlsDialogOpen(false)}
                  >
                      Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 2, height: '32px', fontSize: '0.75rem', fontWeight: 600 }} 
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
