const z = require("zod");

module.exports.loginSchema = z.object({
    email: z.string()
        .min(1, { message: "Email is required." }) // Ensure the input is not empty
        .email({ message: "Invalid email format." })
        .max(100, { message: "Email is too long." }),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters" })
        .max(100, { message: "Password is too long." })
});

module.exports.signupSchema = z.object({
    username: z.string()
        .min(3, { message: "Username must be at least 3 characters." })
        .max(30, { message: "Username is too long." }),

    email: z.string()
        .min(1, { message: "Email is required." })
        .email({ message: "Invalid email format." })
        .max(100, { message: "Email is too long." }),

    password: z.string()
        .min(6, { message: "Password must be at least 6 characters." })
        .max(100, { message: "Password is too long." })
});

module.exports.changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters")
});

module.exports.deleteAccountSchema = z.object({
    password: z.string().min(1, "Password is required")
});

module.exports.onlyEmailSchema = z.object({
    email: z.string().email("Invalid email format")
});

module.exports.createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional()
});

// Create Collection Schema
module.exports.createCollectionSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    collectionName: z.string().min(1, "Collection Name is required"),
    schema: z.array(z.object({
        key: z.string(),
        type: z.enum(['String', 'Number', 'Boolean', 'Date']),
        required: z.boolean().optional()
    })).optional()
});

module.exports.sanitize = (obj) => {
    const clean = {};
    for (const key in obj) {
        if (!key.startsWith('$')) {
            clean[key] = obj[key];
        }
    }
    return clean;
};

const emptyToUndefined = z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().optional());

module.exports.updateExternalConfigSchema = z.object({
    // DB URI: No .url() check because of mongodb+srv
    dbUri: z.preprocess((val) => (val === "" || val === null ? undefined : val),
        z.string().optional().refine(val => !val || val.startsWith('mongodb'), {
            message: "Invalid Database URI format."
        })
    ),

    // Storage URL: Sirf tab check karega jab value empty na ho
    storageUrl: z.preprocess((val) => (val === "" || val === null ? undefined : val),
        z.string().url("Invalid Storage URL format").optional()
    ),

    storageKey: emptyToUndefined,
    storageProvider: z.enum(['supabase', 'aws', 'cloudinary']).optional()
}).refine(data => {
    // Condition 1: Agar Storage URL diya hai, toh Storage Key bhi honi chahiye
    if (data.storageUrl && !data.storageKey) return false;
    // Condition 2: Agar Storage Key di hai, toh Storage URL bhi hona chahiye
    if (data.storageKey && !data.storageUrl) return false;
    // Condition 3: Kam se kam ek cheez (DB ya Storage) poori honi chahiye
    return !!(data.dbUri || (data.storageUrl && data.storageKey));
}, {
    message: "Provide either a DB URI or a complete Storage config (URL + Key)."
});