const z = require("zod");
const {
  MAX_FIELD_DEPTH,
  UNIQUE_SUPPORTED_TYPES,
} = require("./schema.constants");

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
  siteUrl: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().url("Invalid Site URL format").optional(),
  ),
});

const buildFieldSchemaZod = (depth = 1) => {
  const base = z
    .object({
      key: z
        .string()
        .min(1, "Field name is required")
        .regex(/^(?!\$)(?!.*\.)\S+$/, {
          message:
            "Field name must not start with '$', contain '.', or include whitespace",
        }),
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
        if (data.unique === true) {
          if (depth > 1) return false;
          if (!UNIQUE_SUPPORTED_TYPES.includes(data.type)) return false;
        }
        return true;
      },
      {
        message:
          "Invalid field configuration, nesting depth exceeded (max 3 levels), or unique is only supported for top-level primitive fields.",
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
      name: z
        .string()
        .min(1, "Field name is required")
        .regex(/^(?!\$)(?!.*\.)\S+$/, {
          message:
            "Field name must not start with '$', contain '.', or include whitespace",
        }),
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
        if (data.unique === true) {
          if (depth > 1) return false;
          if (!UNIQUE_SUPPORTED_TYPES.includes(normalType)) return false;
        }

        return true;
      },
      {
        message:
          "Invalid field configuration, nesting depth exceeded (max 3 levels), or unique is only supported for top-level primitive fields.",
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
    storageProvider: z.enum(["supabase", "s3", "cloudflare_r2"]).optional(),

    // SCHEMA - AWS S3 / CLOUDFLARE R2 FIELDS
    s3AccessKeyId: emptyToUndefined,
    s3SecretAccessKey: emptyToUndefined,
    s3Region: emptyToUndefined,
    s3Endpoint: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().url("Invalid Endpoint URL format").optional(),
    ),
    s3Bucket: emptyToUndefined,
    publicUrlHost: emptyToUndefined,
  })
  .refine(
    (data) => {
      if (data.storageProvider === "supabase") {
        if (!data.storageUrl || !data.storageKey) return false;
      }

      if (data.storageProvider === "s3") {
        if (
          !data.s3AccessKeyId ||
          !data.s3SecretAccessKey ||
          !data.s3Region ||
          !data.s3Bucket
        ) {
          return false;
        }
      }

      if (data.storageProvider === "cloudflare_r2") {
        if (
          !data.s3AccessKeyId ||
          !data.s3SecretAccessKey ||
          !data.s3Endpoint ||
          !data.s3Bucket ||
          !data.publicUrlHost
        ) {
          return false;
        }
      }

      // VALIDATION - REQUIRE DB URI OR STORAGE CONFIG
      return !!(
        data.dbUri ||
        data.storageProvider ||
        (data.storageUrl && data.storageKey)
      );
    },
    {
      message:
        "Provide either a DB URI or a complete Storage config for the selected provider.",
    },
  );

const socialProviderConfigSchema = z.object({
  enabled: z.boolean().optional(),
  clientId: emptyToUndefined,
  clientSecret: emptyToUndefined,
});

module.exports.updateAuthProvidersSchema = z.object({
  github: socialProviderConfigSchema.optional(),
  google: socialProviderConfigSchema.optional(),
}).refine(
  (data) => !!(data.github || data.google),
  { message: "Provide at least one social auth provider config." },
);

module.exports.userSignupSchema = z.object({
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
});
