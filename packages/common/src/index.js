// Config
const { connectDB } = require("./config/db");
const redis = require("./config/redis");

const {
  setProjectByApiKeyCache,
  getProjectByApiKeyCache,
  deleteProjectByApiKeyCache,
  setProjectById,
  getProjectById,
  deleteProjectById,
  getDeveloperPlanCache,
  setDeveloperPlanCache,
} = require("./redis/redisCaching");

// Models
const Developer = require("./models/Developer");
const Project = require("./models/Project");
const MailTemplate = require("./models/MailTemplate");
const Release = require("./models/Release");
const Log = require("./models/Log");
const Otp = require("./models/otp");
const Webhook = require("./models/Webhook");
const WebhookDelivery = require("./models/WebhookDelivery");
const ProRequest = require("./models/ProRequest");
const ApiAnalytics = require("./models/ApiAnalytics");

// Queues
const { authEmailQueue, initAuthEmailWorker } = require("./queues/authEmailQueue");
const { emailQueue } = require("./queues/emailQueue");
const {
  webhookQueue,
  enqueueWebhookDelivery,
  initWebhookWorker,
  generateSignature,
} = require("./queues/webhookQueue");

// Middleware
const checkAuthEnabled = require('./middleware/checkAuthEnabled')
const verifyEmail = require('./middleware/verifyEmail')
const loadProjectForAdmin = require('./middleware/loadProjectForAdmin')
const standardizeApiResponse = require('./middleware/standardizeApiResponse')

// Utils
const {
  sendOtp,
  sendReleaseEmail,
  sendAuthOtpEmail,
  sendProRequestConfirmationEmail,
} = require("./utils/emailService");
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
  aggregateSchema,
  sanitize,
  userSignupSchema,
  updateExternalConfigSchema,
  updateAuthProvidersSchema,
  createWebhookSchema,
  updateWebhookSchema,
  sendMailSchema,
  sanitizeObjectId,
  sanitizeNonEmptyString,
} = require("./utils/input.validation");
const { garbageCollect, storageGarbageCollect } = require("./utils/GC");
const { generateApiKey, hashApiKey } = require("./utils/api");
const { getConnection } = require("./utils/connection.manager");
const { encrypt, decrypt } = require("./utils/encryption");
const {
  getCompiledModel,
  clearCompiledModel,
  createUniqueIndexes,
} = require("./utils/injectModel");
const { getPublicIp } = require("./utils/network");
const {
  isProjectStorageExternal,
  isProjectDbExternal,
  getBucket,
} = require("./utils/project.helpers");
const QueryEngine = require("./utils/queryEngine");
const { registry, storageRegistry } = require("./utils/registry");
const { getStorage, getPresignedUploadUrl, verifyUploadedFile } = require("./utils/storage.manager");
const validateEnv = require("./utils/validateEnv");
const { validateData, validateUpdateData } = require("./utils/validateData");
const sessionManager = require("./utils/session.manager");
const planLimits = require("./utils/planLimits");
const AppError = require("./utils/AppError");

module.exports = {
  connectDB,
  redis,
  Developer,
  Project,
  MailTemplate,
  Release,
  Log,
  Otp,
  Webhook,
  WebhookDelivery,
  ProRequest,
  authEmailQueue,
  emailQueue,
  webhookQueue,
  enqueueWebhookDelivery,
  initWebhookWorker,
  generateSignature,
  sendOtp,
  sendReleaseEmail,
  sendAuthOtpEmail,
  sendProRequestConfirmationEmail,
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
  aggregateSchema,
  sanitize,
  updateExternalConfigSchema,
  updateAuthProvidersSchema,
  createWebhookSchema,
  updateWebhookSchema,
  sendMailSchema,
  sanitizeObjectId,
  sanitizeNonEmptyString,
  garbageCollect,
  storageGarbageCollect,
  generateApiKey,
  hashApiKey,
  getConnection,
  encrypt,
  decrypt,
  getCompiledModel,
  clearCompiledModel,
  createUniqueIndexes,
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
  standardizeApiResponse,
  setProjectByApiKeyCache,
  getProjectByApiKeyCache,
  deleteProjectByApiKeyCache,
  setProjectById,
  getProjectById,
  deleteProjectById,
  getDeveloperPlanCache,
  setDeveloperPlanCache,
  validateData,
  validateUpdateData,
  userSignupSchema,
  initAuthEmailWorker,
  ...sessionManager,
  ...planLimits,
  AppError,
  getPresignedUploadUrl,
  verifyUploadedFile,
  ApiAnalytics,
};
