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
const PlatformEvent = require("./models/PlatformEvent");
const DeveloperActivity = require("./models/DeveloperActivity");
const MailLog = require("./models/MailLog");
const Invitation = require("./models/Invitation");

// Queues
const { authEmailQueue, initAuthEmailWorker } = require("./queues/authEmailQueue");
const { publicEmailQueue, initPublicEmailWorker } = require("./queues/publicEmailQueue");
const { emailQueue } = require("./queues/emailQueue");
const { exportQueue } = require("./queues/exportQueue");
const {
  webhookQueue,
  enqueueWebhookDelivery,
  initWebhookWorker,
  generateSignature,
} = require("./queues/webhookQueue");
const {
  activityRollupQueue,
  scheduleActivityRollup,
  initActivityRollupWorker,
} = require("./queues/activityRollupQueue");
const {
  reliabilityAlertQueue,
  scheduleReliabilityAlert,
  initReliabilityAlertWorker,
} = require("./queues/reliabilityAlertQueue");
const {
  trashCleanupQueue,
  enqueueCollectionCleanup,
  syncCollectionCleanup,
  initTrashCleanupWorker,
} = require("./queues/trashCleanupQueue");

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
const { getStorage, getPresignedUploadUrl, verifyUploadedFile, getS3CompatibleStorage } = require("./utils/storage.manager");
const validateEnv = require("./utils/validateEnv");
const { validateData, validateUpdateData } = require("./utils/validateData");
const sessionManager = require("./utils/session.manager");
const planLimits = require("./utils/planLimits");
const AppError = require("./utils/AppError");
const ApiResponse = require("./utils/ApiResponse");
const { checkLockout, recordFailedAttempt, clearLockout } = require("./utils/loginLockout");
const { dispatchWebhooks } = require("./utils/webhookDispatcher");
const { getDayKey, getMonthKey, getEndOfMonthTtlSeconds, incrWithTtlAtomic } = require("./utils/usageCounter");
const { getProjectAccessQuery, getProjectRole } = require("./utils/projectAccess");

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
  PlatformEvent,
  DeveloperActivity,
  MailLog,
  Invitation,
  authEmailQueue,
  exportQueue,
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
  publicEmailQueue,
  initPublicEmailWorker,
  ...sessionManager,
  ...planLimits,
  AppError,
  ApiResponse,
  getPresignedUploadUrl,
  verifyUploadedFile,
  activityRollupQueue,
  scheduleActivityRollup,
  initActivityRollupWorker,
  reliabilityAlertQueue,
  scheduleReliabilityAlert,
  initReliabilityAlertWorker,
  ApiAnalytics,
  checkLockout,
  recordFailedAttempt,
  clearLockout,
  trashCleanupQueue,
  enqueueCollectionCleanup,
  syncCollectionCleanup,
  initTrashCleanupWorker,
  dispatchWebhooks,
  getDayKey,
  getMonthKey,
  getEndOfMonthTtlSeconds,
  incrWithTtlAtomic,
  getS3CompatibleStorage,
  getProjectAccessQuery,
  getProjectRole,
};
