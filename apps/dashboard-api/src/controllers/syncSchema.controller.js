const { z } = require("zod");
const {
  Project,
  AppError,
  ApiResponse,
  syncSchemaPayload,
  resolveEffectivePlan,
  getPlanLimits,
  deleteProjectById,
  deleteProjectByApiKeyCache,
  setProjectById,
  getProjectAccessQuery,
} = require("@urbackend/common");

// ── Helpers (mirrored from project.controller.js) ───────────────────────────

const normalizeFieldKey = (key) =>
  String(key || "")
    .replace(/\uFEFF/g, "")
    .trim();

const normalizeFieldType = (type) =>
  String(type || "")
    .trim()
    .toLowerCase();

const isRequiredField = (required) =>
  required === true ||
  required === 1 ||
  String(required).trim().toLowerCase() === "true" ||
  String(required).trim() === "1";

const toPlainObject = (value) => {
  if (!value || typeof value !== "object") return value;
  if (typeof value.toObject === "function") {
    return value.toObject({ depopulate: true });
  }
  if (value._doc && typeof value._doc === "object") {
    return { ...value._doc };
  }
  return value;
};

const sanitizeSchemaFields = (schema = []) => {
  if (!Array.isArray(schema)) return [];
  return schema
    .map((rawField) => {
      const field = toPlainObject(rawField);
      if (!field || typeof field !== "object") return null;

      const normalizedKey = normalizeFieldKey(field.key);
      if (!normalizedKey) return null;

      const next = { ...field, key: normalizedKey };
      if (field.default !== undefined) {
        next.default = field.default;
      }

      if (Array.isArray(field.fields)) {
        next.fields = sanitizeSchemaFields(field.fields);
      }

      if (field.items && typeof field.items === "object") {
        next.items = { ...field.items };
        if (Array.isArray(field.items.fields)) {
          next.items.fields = sanitizeSchemaFields(field.items.fields);
        }
      }

      return next;
    })
    .filter(Boolean);
};

const getDefaultRlsForCollection = (collectionName, schema = []) => {
  const normalizedName = String(collectionName || "").toLowerCase();
  const keys = sanitizeSchemaFields(schema).map((f) => f.key);

  let ownerField = "userId";
  if (normalizedName === "users") {
    ownerField = "_id";
  } else if (keys.includes("userId")) {
    ownerField = "userId";
  } else if (keys.includes("ownerId")) {
    ownerField = "ownerId";
  }

  return {
    enabled: false,
    mode: "public-read",
    ownerField,
    requireAuthForWrite: true,
  };
};

/**
 * Validates that a users collection schema contains the required
 * `email` (String, required) and `password` (String, required) fields.
 */
const validateUsersSchema = (schema) => {
  if (!Array.isArray(schema)) return false;
  const sanitized = sanitizeSchemaFields(schema);

  const hasEmail = sanitized.find(
    (f) =>
      normalizeFieldKey(f.key).toLowerCase() === "email" &&
      normalizeFieldType(f.type) === "string" &&
      isRequiredField(f.required),
  );

  const hasPassword = sanitized.find(
    (f) =>
      normalizeFieldKey(f.key).toLowerCase() === "password" &&
      normalizeFieldType(f.type) === "string" &&
      isRequiredField(f.required),
  );

  return !!(hasEmail && hasPassword);
};

// ── Controller ──────────────────────────────────────────────────────────────

/**
 * PUT /projects/:projectId/sync-schema
 *
 * Atomically replaces the project's collection schema definitions.
 *
 * Behaviour:
 * - Preserves RLS settings for collections that already exist.
 * - Applies safe defaults for newly introduced collections.
 * - Enforces plan-based collection limits.
 * - Validates the `users` collection contract (email + password required).
 * - Does NOT drop underlying MongoDB collections — only updates config.
 */
module.exports.syncSchema = async (req, res, next) => {
  try {
    // 1. Validate payload
    const { collections: incoming } = syncSchemaPayload.parse(req.body);

    const { projectId } = req.params;

    // 2. Load project (authorizeProject middleware already attached req.project)
    const project = req.project;
    if (!project) {
      return next(new AppError(404, "Project not found or access denied"));
    }

    // 3. Plan enforcement — check collection count limit
    if (req.developer) {
      const effectivePlan = resolveEffectivePlan(req.developer);
      const limits = getPlanLimits({
        plan: effectivePlan,
        customLimits: project.customLimits,
      });

      if (limits.maxCollections !== -1 && incoming.length > limits.maxCollections) {
        return next(
          new AppError(
            403,
            `Schema sync would create ${incoming.length} collections, but your plan allows ${limits.maxCollections}. Please upgrade your plan.`,
          ),
        );
      }
    }

    // 4. Build a lookup of existing collections for RLS preservation
    const existingByName = new Map();
    for (const col of project.collections || []) {
      const plain = toPlainObject(col);
      existingByName.set(plain.name, plain);
    }

    // 5. Merge: sanitize fields, preserve RLS, validate users contract
    const merged = [];
    for (const entry of incoming) {
      const sanitizedModel = sanitizeSchemaFields(entry.model || []);

      // Enforce users schema contract
      if (entry.name.toLowerCase() === "users") {
        if (!validateUsersSchema(sanitizedModel)) {
          return next(
            new AppError(
              422,
              "The 'users' collection must have required 'email' and 'password' String fields.",
            ),
          );
        }
      }

      const existing = existingByName.get(entry.name);

      merged.push({
        name: entry.name,
        model: sanitizedModel,
        rls: existing?.rls || getDefaultRlsForCollection(entry.name, sanitizedModel),
      });
    }

    // 6. Atomic update — single $set, no partial states
    const updated = await Project.findOneAndUpdate(
      { _id: projectId, ...getProjectAccessQuery(req.user._id) },
      { $set: { collections: merged } },
      { new: true },
    );

    if (!updated) {
      return next(new AppError(404, "Project not found or access denied"));
    }

    // 7. Invalidate caches so subsequent reads are fresh
    await deleteProjectById(projectId);
    await setProjectById(projectId, updated.toObject());
    await deleteProjectByApiKeyCache(updated.publishableKey);
    await deleteProjectByApiKeyCache(updated.secretKey);

    // 8. Respond
    return new ApiResponse(
      {
        synced: merged.length,
        collections: merged.map((c) => c.name),
      },
      `Successfully synced ${merged.length} collection schema(s).`,
    ).send(res);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues[0]?.message || "Invalid schema payload"));
    }
    next(err);
  }
};
