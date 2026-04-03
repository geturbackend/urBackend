// Config
const { connectDB } = require('./config/db');
const redis = require('./config/redis');

// redis cache
const {
      setProjectByApiKeyCache,
      getProjectByApiKeyCache,
      deleteProjectByApiKeyCache,
      setProjectById,
      getProjectById,
      deleteProjectById
  } = require('./redis/redisCaching');

// Models
const Developer = require('./models/Developer');
const Project = require('./models/Project');
const Release = require('./models/Release');
const Log = require('./models/Log');
const Otp = require('./models/otp');

// Queues
const { authEmailQueue } = require('./queues/authEmailQueue');
const { emailQueue } = require('./queues/emailQueue');

// Middleware
const checkAuthEnabled = require('./middleware/checkAuthEnabled')
const verifyEmail = require('./middleware/verifyEmail')
const loadProjectForAdmin = require('./middleware/loadProjectForAdmin')

// Utils
const { sendOtp, sendReleaseEmail, sendAuthOtpEmail } = require('./utils/emailService');
const { 
    loginSchema,
    signupSchema,
    changePasswordSchema,
    deleteAccountSchema,
    onlyEmailSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    createProjectSchema,
    createCollectionSchema,
    createSchemaApiKeySchema,
    sanitize,
    userSignupSchema,
    updateExternalConfigSchema 
} = require('./utils/input.validation');
const {garbageCollect, storageGarbageCollect} = require('./utils/GC');
const { generateApiKey, hashApiKey } = require('./utils/api')
const { getConnection } = require('./utils/connection.manager')
const { encrypt, decrypt } = require('./utils/encryption');
const { getCompiledModel, clearCompiledModel } = require('./utils/injectModel');
const { getPublicIp } = require('./utils/network');
const { isProjectStorageExternal,
        isProjectDbExternal,
        getBucket 
    } = require('./utils/project.helpers');
const QueryEngine = require('./utils/queryEngine');
const { registry, storageRegistry } = require('./utils/registry');
const { getStorage } = require('./utils/storage.manager');
const validateEnv = require('./utils/validateEnv');
const {validateData, validateUpdateData} = require('./utils/validateData')
const sessionManager = require('./utils/session.manager');
const { checkAndNotify } = require('./utils/limitNotification');
const { calculateExternalDbSize } = require('./utils/calculateExternalDbSize');
const { sendLimitWarningEmail } = require('./utils/emailService');

module.exports = {
  connectDB,
  redis,
  Developer,
  Project,
  Release,
  Log,
  Otp,
  authEmailQueue,
  emailQueue,
  sendOtp,
  sendReleaseEmail,
  sendAuthOtpEmail,
  loginSchema,
  signupSchema,
  changePasswordSchema,
  deleteAccountSchema,
  onlyEmailSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  createProjectSchema,
  createCollectionSchema,
  createSchemaApiKeySchema,
  sanitize,
  updateExternalConfigSchema,
  garbageCollect,
  storageGarbageCollect,
  generateApiKey,
  hashApiKey,
  getConnection,
  encrypt,
  decrypt,
  getCompiledModel,
  clearCompiledModel,
  getPublicIp,
  isProjectStorageExternal,
  isProjectDbExternal,
  getBucket,
  QueryEngine,
  registry,
  storageRegistry,
  getStorage,
  checkAuthEnabled,
  verifyEmail,
  validateEnv,
  loadProjectForAdmin,
  setProjectByApiKeyCache,
  getProjectByApiKeyCache,
  deleteProjectByApiKeyCache,
  setProjectById,
  getProjectById,
  deleteProjectById,
  validateData,
  validateUpdateData,
  userSignupSchema,
  ...sessionManager,
  checkAndNotify,
  calculateExternalDbSize,
  sendLimitWarningEmail,
};