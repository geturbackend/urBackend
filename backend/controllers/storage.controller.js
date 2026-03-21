const { getStorage } = require("../utils/storage.manager");
const { randomUUID } = require("crypto");
const Project = require("../models/Project");
const { isProjectStorageExternal } = require("../utils/project.helpers");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getBucket = (project) =>
  isProjectStorageExternal(project) ? "files" : "dev-files";

/**
 * Upload File
 */
module.exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: "File size exceeds limit." });
    }

    const project = req.project;
    const external = isProjectStorageExternal(project);
    const bucket = getBucket(project);

    // ATOMIC QUOTA RESERVATION
    if (!external) {
      const result = await Project.updateOne(
        {
          _id: project._id,
          $expr: {
            $lte: [{ $add: ["$storageUsed", file.size] }, "$storageLimit"],
          },
        },
        { $inc: { storageUsed: file.size } },
      );

      if (result.matchedCount === 0) {
        return res
          .status(403)
          .json({ error: "Internal storage limit exceeded." });
      }
    }

    const supabase = await getStorage(project);

    const safeName = file.originalname.replace(/\s+/g, "_");
    const filePath = `${project._id}/${randomUUID()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      // ROLLBACK QUOTA
      if (!external) {
        await Project.updateOne(
          { _id: project._id },
          { $inc: { storageUsed: -file.size } },
        );
      }
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return res.status(201).json({
      message: "File uploaded successfully",
      url: publicUrlData.publicUrl,
      path: filePath,
      provider: external ? "external" : "internal",
    });
  } catch (err) {
    return res.status(500).json({
      error: "File upload failed",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Delete File
 */
module.exports.deleteFile = async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: "File path is required." });
    }

    const project = req.project;
    const external = isProjectStorageExternal(project);
    const bucket = getBucket(project);

    if (!path.startsWith(`${project._id}/`)) {
      return res.status(403).json({ error: "Access denied." });
    }

    const supabase = await getStorage(project);

    // Fetch metadata before delete (for internal storage accounting)
    let fileSize = 0;
    if (!external) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split("/")[0], {
          search: path.split("/").slice(1).join("/"),
        });

      if (error) throw error;
      if (data?.length) {
        fileSize = data[0].metadata?.size || 0;
      }
    }

    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (deleteError) throw deleteError;

    if (!external && fileSize > 0) {
      await Project.updateOne(
        { _id: project._id },
        { $inc: { storageUsed: -fileSize } },
      );
    }

    return res.json({ message: "File deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      error: "File deletion failed",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports.deleteAllFiles = async (req, res) => {
  try {
    const project = req.project; // assuming middleware attaches project
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const supabase = await getStorage(project);
    const bucket = getBucket(project);

    let hasMore = true;
    let deletedCount = 0;

    while (hasMore) {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list(project._id.toString(), { limit: 100 });

      if (error) throw error;

      if (!files || files.length === 0) {
        hasMore = false;
        break;
      }

      const paths = files.map((f) => `${project._id}/${f.name}`);

      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (removeError) throw removeError;

      deletedCount += files.length;
    }

    // Reset usage only for internal storage
    if (!isProjectStorageExternal(project)) {
      await Project.updateOne(
        { _id: project._id },
        { $set: { storageUsed: 0 } },
      );
    }

    res.json({
      success: true,
      deleted: deletedCount,
      provider: isProjectStorageExternal(project) ? "external" : "internal",
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to delete files",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
