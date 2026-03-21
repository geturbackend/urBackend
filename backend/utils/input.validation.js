const z = require("zod");

module.exports.loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Invalid email format." })
    .max(100, { message: "Email is too long." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password is too long." }),
});

module.exports.signupSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(50, { message: "Username must be between 3 and 50 characters." }),

  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Invalid email format." })
    .max(100, { message: "Email is too long." }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .max(100, { message: "Password is too long." }),
});

module.exports.changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

module.exports.deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

module.exports.onlyEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

module.exports.verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

module.exports.resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long."),
});

module.exports.createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

// FUNCTION - BUILD FIELD SCHEMA ZOD
const MAX_FIELD_DEPTH = 3;

const buildFieldSchemaZod = (depth = 1) => {
  const base = z
    .object({
      key: z.string().min(1, "Field name is required"),
      type: z.enum([
        "String",
        "Number",
        "Boolean",
        "Date",
        "Object",
        "Array",
        "Ref",
      ]),
      required: z.boolean().optional(),
      unique: z.boolean().optional(),
      ref: z.string().optional(),
      items: z
        .object({
          type: z.enum([
            "String",
            "Number",
            "Boolean",
            "Date",
            "Object",
            "Ref",
          ]),
          fields: z.lazy(() =>
            depth < MAX_FIELD_DEPTH
              ? z.array(buildFieldSchemaZod(depth + 1)).optional()
              : z.undefined().optional(),
          ),
        })
        .optional(),
      fields: z.lazy(() =>
        depth < MAX_FIELD_DEPTH
          ? z.array(buildFieldSchemaZod(depth + 1)).optional()
          : z.undefined().optional(),
      ),
    })
    .refine(
      (data) => {
        if (
          data.type === "Object" &&
          (!data.fields || data.fields.length === 0)
        )
          return false;
        if (data.type === "Array" && !data.items) return false;
        if (data.type === "Ref" && !data.ref) return false;
        if (
          depth >= MAX_FIELD_DEPTH &&
          (data.type === "Object" ||
            (data.type === "Array" && data.items?.type === "Object"))
        )
          return false;
        return true;
      },
      {
        message:
          "Invalid field configuration for the given type, or nesting depth exceeded (max 3 levels).",
      },
    );

  return base;
};

const fieldSchemaZod = buildFieldSchemaZod(1);

// SCHEMA - CREATE COLLECTION (DASHBOARD)
module.exports.createCollectionSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  collectionName: z.string().min(1, "Collection Name is required"),
  schema: z.array(fieldSchemaZod).optional(),
});

// SCHEMA - CREATE COLLECTION (API)
const buildApiFieldSchemaZod = (depth = 1) => {
  const base = z
    .object({
      name: z.string().min(1, "Field name is required"),
      type: z.enum([
        "string",
        "number",
        "boolean",
        "date",
        "object",
        "array",
        "ref",
        "String",
        "Number",
        "Boolean",
        "Date",
        "Object",
        "Array",
        "Ref",
      ]),
      required: z.boolean().optional(),
      unique: z.boolean().optional(),
      ref: z.string().optional(),
      items: z
        .object({
          type: z.enum([
            "string",
            "number",
            "boolean",
            "date",
            "object",
            "ref",
            "String",
            "Number",
            "Boolean",
            "Date",
            "Object",
            "Ref",
          ]),
          fields: z.lazy(() =>
            depth < MAX_FIELD_DEPTH
              ? z.array(buildApiFieldSchemaZod(depth + 1)).optional()
              : z.undefined().optional(),
          ),
        })
        .optional(),
      fields: z.lazy(() =>
        depth < MAX_FIELD_DEPTH
          ? z.array(buildApiFieldSchemaZod(depth + 1)).optional()
          : z.undefined().optional(),
      ),
    })
    .refine(
      (data) => {
        const normalType =
          data.type.charAt(0).toUpperCase() + data.type.slice(1).toLowerCase();
        if (
          normalType === "Object" &&
          (!data.fields || data.fields.length === 0)
        )
          return false;
        if (normalType === "Array" && !data.items) return false;
        if (normalType === "Ref" && !data.ref) return false;
        if (
          depth >= MAX_FIELD_DEPTH &&
          (normalType === "Object" ||
            (normalType === "Array" &&
              data.items?.type?.charAt(0).toUpperCase() +
                data.items?.type?.slice(1).toLowerCase() ===
                "Object"))
        )
          return false;
        return true;
      },
      {
        message:
          "Invalid field configuration for the given type, or nesting depth exceeded (max 3 levels).",
      },
    );

  return base;
};

module.exports.createSchemaApiKeySchema = z.object({
  name: z.string().min(1, "Collection Name is required"),
  fields: z.array(buildApiFieldSchemaZod(1)).optional(),
});

module.exports.sanitize = (obj) => {
  const clean = {};
  for (const key in obj) {
    if (!key.startsWith("$")) {
      clean[key] = obj[key];
    }
  }
  return clean;
};

const emptyToUndefined = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.string().optional(),
);

module.exports.updateExternalConfigSchema = z
  .object({
    dbUri: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z
        .string()
        .optional()
        .refine((val) => !val || val.startsWith("mongodb"), {
          message: "Invalid Database URI format.",
        }),
    ),
    storageUrl: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().url("Invalid Storage URL format").optional(),
    ),
    storageKey: emptyToUndefined,
    storageProvider: z.enum(["supabase", "aws", "cloudinary"]).optional(),
  })
  .refine(
    (data) => {
      if (data.storageUrl && !data.storageKey) return false;
      if (data.storageKey && !data.storageUrl) return false;
      return !!(data.dbUri || (data.storageUrl && data.storageKey));
    },
    {
      message:
        "Provide either a DB URI or a complete Storage config (URL + Key).",
    },
  );

module.exports.userSignupSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters." })
      .max(50, { message: "Username must be between 3 and 50 characters." })
      .optional(),

    email: z
      .string()
      .min(1, { message: "Email is required." })
      .email({ message: "Invalid email format." })
      .max(100, { message: "Email is too long." }),

    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." })
      .max(100, { message: "Password is too long." }),
  })
  .passthrough();
