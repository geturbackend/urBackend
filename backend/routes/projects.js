const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const verifyEmail = require('../middleware/verifyEmail')
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
    insertData,
    editRow,
    uploadFile,
    listFiles,
    deleteFile,
    deleteAllFiles,
    deleteProject,
    updateProject,
    updateExternalConfig,
    deleteExternalDbConfig,
    deleteExternalStorageConfig,
    analytics,
    updateAllowedDomains
} = require("../controllers/project.controller")

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB Limit


// ROUTES
// CREATE PROJECT
router.post('/', authMiddleware, verifyEmail, createProject);

// GET ALL PROJECTS
router.get('/', authMiddleware, getAllProject);

// GET SINGLE PROJECT
router.get('/:projectId', authMiddleware, getSingleProject);

// REGENERATE API KEY
router.patch('/:projectId/regenerate-key', authMiddleware, regenerateApiKey);

// CREATE COLLECTION (Fixed Validation)
router.post('/collection', authMiddleware, verifyEmail, createCollection);

// DELETE COLLECTION
router.delete('/:projectId/collections/:collectionName', authMiddleware, verifyEmail, deleteCollection);

// INTERNAL DATA ROUTES

// GET DATA
router.get('/:projectId/collections/:collectionName/data', authMiddleware, getData);

// DELETE ROW
router.delete('/:projectId/collections/:collectionName/data/:id', authMiddleware, deleteRow);

// EDIT ROW
router.patch('/:projectId/collections/:collectionName/data/:id', authMiddleware, editRow);

// LIST FILES
router.get('/:projectId/storage/files', authMiddleware, listFiles);

// UPLOAD FILE
router.post('/:projectId/storage/upload', authMiddleware, verifyEmail, upload.single('file'), uploadFile);

// DELETE FILE
router.post('/:projectId/storage/delete', authMiddleware, verifyEmail, deleteFile);

// DELETE PROJECT
router.delete('/:projectId', authMiddleware, verifyEmail, deleteProject);

// UPDATE PROJECT
router.patch('/:projectId', authMiddleware, updateProject);

// UPDATE ALLOWED DOMAINS
router.patch('/:projectId/allowed-domains', authMiddleware, verifyEmail, updateAllowedDomains);

// UPDATE EXTERNAL CONFIG
router.patch('/:projectId/byod-config', authMiddleware, updateExternalConfig);

// DELETE EXTERNAL DB CONFIG
router.delete('/:projectId/byod-config/db', authMiddleware, deleteExternalDbConfig);

// DELETE EXTERNAL SUPABASE CONFIG
router.delete('/:projectId/byod-config/storage', authMiddleware, deleteExternalStorageConfig);

// INSERT DATA (Dashboard)
router.post('/:projectId/collections/:collectionName/data', authMiddleware, verifyEmail, insertData);

// DELETE ALL FILES
router.delete('/:projectId/storage/files', authMiddleware, deleteAllFiles);

// ANALYTICS
router.get('/:projectId/analytics', authMiddleware, analytics);

module.exports = router;