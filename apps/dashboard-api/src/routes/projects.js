const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const planEnforcement = require('../middlewares/planEnforcement');
const authorizeProject = require('../middlewares/authorizeProject');
const { verifyEmail, checkAuthEnabled } = require('@urbackend/common');
const multer = require('multer');
const storage = multer.memoryStorage();

const {
    createProject,
    getAllProject,
    getSingleProject,
    regenerateApiKey,
    createCollection,
    deleteCollection,
    getData,
    deleteRow,
    recoverRow,
    insertData,
    editRow,
    listFiles,
    deleteFile,
    deleteAllFiles,
    deleteProject,
    updateProject,
    updateExternalConfig,
    deleteExternalDbConfig,
    deleteExternalStorageConfig,
    analytics,
    updateAllowedDomains,
    toggleAuth,
    updateAuthProviders,
    updateCollectionRls,
    listMailTemplates,
    listGlobalMailTemplates,
    getMailTemplate,
    createMailTemplate,
    updateMailTemplate,
    deleteMailTemplate,
    requestUpload,
    confirmUpload,
    getMailLogs,
    getResendLiveStatus,
    manageAudiences,
    deleteAudience,
    manageContacts,
    deleteContact,
    sendMarketingBroadcast,
    getMembers,
    inviteMember,
    updateMemberRole,
    removeMember
} = require("../controllers/project.controller");

const { createAdminUser, resetPassword, getUserDetails, updateAdminUser, listAdminUsers, deleteAdminUser, listUserSessions, revokeUserSession } = require('../controllers/userAuth.controller');

const exportController = require('../controllers/dbExport.controller');

// POST REQ FOR CREATE PROJECT
router.post('/', authMiddleware, verifyEmail, planEnforcement.checkProjectLimit, createProject);
router.get('/', authMiddleware, getAllProject);
router.get('/:projectId', authMiddleware, authorizeProject(), getSingleProject);
router.post('/:projectId/api-key', authMiddleware, authorizeProject('admin'), verifyEmail, regenerateApiKey);

router.post('/:projectId/collections', authMiddleware, authorizeProject('admin'), verifyEmail, planEnforcement.attachDeveloper, planEnforcement.checkCollectionLimit, createCollection);

// DELETE REQ FOR COLLECTION
router.delete('/:projectId/collections/:collectionName', authMiddleware, authorizeProject('admin'), verifyEmail, deleteCollection);

// GET REQ FOR DATA
router.get('/:projectId/collections/:collectionName/data', authMiddleware, authorizeProject(), getData);

// DELETE REQ FOR ROW
router.delete('/:projectId/collections/:collectionName/data/:id', authMiddleware, authorizeProject('admin'), deleteRow);

// PATCH REQ FOR RECOVER ROW
router.patch('/:projectId/collections/:collectionName/data/:id/recover', authMiddleware, authorizeProject('admin'), recoverRow);

// PATCH REQ FOR EDIT ROW
router.patch('/:projectId/collections/:collectionName/data/:id', authMiddleware, authorizeProject('admin'), editRow);

// GET REQ FOR FILES
router.get('/:projectId/storage/files', authMiddleware, authorizeProject(), listFiles);

// POST REQ FOR DELETE FILE
router.post('/:projectId/storage/delete', authMiddleware, authorizeProject('admin'), verifyEmail, deleteFile);

//SIGNED URL
router.post('/:projectId/storage/upload-request', authMiddleware, authorizeProject('admin'), verifyEmail, requestUpload);
//UPLOAD URL
router.post('/:projectId/storage/upload-confirm', authMiddleware, authorizeProject('admin'), verifyEmail, confirmUpload);

// DELETE REQ FOR PROJECT
router.delete('/:projectId', authMiddleware, authorizeProject('owner'), verifyEmail, deleteProject);

// PATCH REQ FOR UPDATE PROJECT
router.patch('/:projectId', authMiddleware, authorizeProject('admin'), planEnforcement.attachDeveloper, planEnforcement.checkByokGate, updateProject);

// MAIL TEMPLATES (Phase 2)
router.get('/:projectId/mail/templates', authMiddleware, authorizeProject(), listMailTemplates);
router.get('/:projectId/mail/templates/global', authMiddleware, authorizeProject(), listGlobalMailTemplates);
router.get('/:projectId/mail/templates/:templateId', authMiddleware, authorizeProject(), getMailTemplate);
router.post('/:projectId/mail/templates', authMiddleware, authorizeProject('admin'), verifyEmail, planEnforcement.attachDeveloper, planEnforcement.checkMailTemplatesGate, createMailTemplate);
router.patch('/:projectId/mail/templates/:templateId', authMiddleware, authorizeProject('admin'), verifyEmail, planEnforcement.attachDeveloper, planEnforcement.checkMailTemplatesGate, updateMailTemplate);
router.delete('/:projectId/mail/templates/:templateId', authMiddleware, authorizeProject('admin'), verifyEmail, deleteMailTemplate);

// EXPANDED MAIL API PLATFORM PROXIES
router.get('/:projectId/mail/logs', authMiddleware, authorizeProject(), getMailLogs);
router.get('/:projectId/mail/logs/:resendId/live', authMiddleware, authorizeProject(), getResendLiveStatus);
router.get('/:projectId/mail/audiences', authMiddleware, authorizeProject(), manageAudiences);
router.post('/:projectId/mail/audiences', authMiddleware, authorizeProject('admin'), verifyEmail, manageAudiences);
router.delete('/:projectId/mail/audiences/:audienceId', authMiddleware, authorizeProject('admin'), verifyEmail, deleteAudience);
router.get('/:projectId/mail/audiences/:audienceId/contacts', authMiddleware, authorizeProject(), manageContacts);
router.post('/:projectId/mail/audiences/:audienceId/contacts', authMiddleware, authorizeProject('admin'), verifyEmail, manageContacts);
router.delete('/:projectId/mail/audiences/:audienceId/contacts/:contactId', authMiddleware, authorizeProject('admin'), verifyEmail, deleteContact);
router.post('/:projectId/mail/broadcasts', authMiddleware, authorizeProject('admin'), verifyEmail, sendMarketingBroadcast);

// PATCH REQ FOR ALLOWED DOMAINS
router.patch('/:projectId/allowed-domains', authMiddleware, authorizeProject('admin'), verifyEmail, updateAllowedDomains);

// PATCH REQ FOR BYOD CONFIG
router.delete('/:projectId/byod-config/db', authMiddleware, authorizeProject('admin'), deleteExternalDbConfig);

// DELETE REQ FOR BYOD STORAGE CONFIG
router.delete('/:projectId/byod-config/storage', authMiddleware, authorizeProject('admin'), deleteExternalStorageConfig);

// POST REQ FOR INSERT DATA
router.post('/:projectId/collections/:collectionName/data', authMiddleware, authorizeProject('admin'), verifyEmail, insertData);

// DELETE REQ FOR ALL FILES
router.delete('/:projectId/storage/files', authMiddleware, authorizeProject('admin'), deleteAllFiles);

// GET REQ FOR ANALYTICS
router.get('/:projectId/analytics', authMiddleware, authorizeProject(), analytics);

// PATCH REQ FOR TOGGLE AUTH
router.patch('/:projectId/auth/toggle', authMiddleware, authorizeProject('admin'), verifyEmail, toggleAuth);

// PATCH REQ FOR SOCIAL AUTH PROVIDERS
router.patch('/:projectId/auth/providers', authMiddleware, authorizeProject('admin'), planEnforcement.attachDeveloper, verifyEmail, planEnforcement.checkByokGate, updateAuthProviders);

// PATCH REQ FOR BYOD CONFIG
router.patch('/:projectId/byod-config', authMiddleware, authorizeProject('admin'), planEnforcement.attachDeveloper, planEnforcement.checkByodGate, updateExternalConfig);

// PATCH REQ FOR COLLECTION RLS SETTINGS
router.patch('/:projectId/collections/:collectionName/rls', authMiddleware, authorizeProject('admin'), verifyEmail, updateCollectionRls);

// TEAM MEMBER MANAGEMENT
router.get('/:projectId/members', authMiddleware, authorizeProject(), getMembers);
router.post('/:projectId/members/invite', authMiddleware, authorizeProject('owner'), verifyEmail, planEnforcement.attachDeveloper, planEnforcement.checkMemberLimit, inviteMember);
router.patch('/:projectId/members/:memberId/role', authMiddleware, authorizeProject('owner'), verifyEmail, updateMemberRole);
router.delete('/:projectId/members/:memberId', authMiddleware, authorizeProject('owner'), verifyEmail, removeMember);

// ADMIN AUTH ROUTES

router.post('/:projectId/admin/users', authMiddleware, authorizeProject('admin'), checkAuthEnabled, createAdminUser);
router.patch('/:projectId/admin/users/:userId/password', authMiddleware, authorizeProject('admin'), checkAuthEnabled, resetPassword);
router.get('/:projectId/admin/users', authMiddleware, authorizeProject(), checkAuthEnabled, listAdminUsers);
router.get('/:projectId/admin/users/:userId', authMiddleware, authorizeProject(), checkAuthEnabled, getUserDetails);
router.put('/:projectId/admin/users/:userId', authMiddleware, authorizeProject('admin'), checkAuthEnabled, updateAdminUser);
router.delete('/:projectId/admin/users/:userId', authMiddleware, authorizeProject('admin'), checkAuthEnabled, deleteAdminUser);

// SESSION MANAGEMENT (Admin)
router.get('/:projectId/admin/users/:userId/sessions', authMiddleware, authorizeProject(), checkAuthEnabled, listUserSessions);
router.delete('/:projectId/admin/users/:userId/sessions/:tokenId', authMiddleware, authorizeProject('admin'), checkAuthEnabled, revokeUserSession);

// POST req for DB EXPORT
router.post('/:projectId/collections/:collectionName/export', authMiddleware, authorizeProject(), exportController.dbExportHandler);

module.exports = router;
