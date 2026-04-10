import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { adminAuth } from '../middleware/adminAuth.js';
import { Project } from '../models/Project.js';
import {
  createShareToken,
  normalizeRelativePath,
} from '../utils/projectUtils.js';

const router = express.Router();
const uploadsRoot = path.resolve(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const projectId = req.params.projectId;
      const target = path.join(uploadsRoot, projectId);
      await fs.mkdir(target, { recursive: true });
      cb(null, target);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 2000,
  },
});

function uploadProjectFiles(req, res, next) {
  upload.array('files', 2000)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const messageByCode = {
        LIMIT_FILE_SIZE: 'A file is larger than the 50MB limit.',
        LIMIT_FILE_COUNT: 'Too many files in one batch.',
        LIMIT_UNEXPECTED_FILE: 'Unexpected file field received.',
      };

      res.status(400).json({ message: messageByCode[error.code] ?? error.message });
      return;
    }

    next(error);
  });
}

async function cleanupStoredFiles(projectId, storedNames) {
  if (!storedNames.length) {
    return;
  }

  await Promise.all(
    storedNames.map(async (storedName) => {
      const absolutePath = path.join(uploadsRoot, projectId, storedName);
      try {
        await fs.rm(absolutePath, { force: true });
      } catch {
        // Best effort cleanup for duplicate retries.
      }
    }),
  );
}

// router.use(adminAuth);

router.get('/projects', async (_req, res, next) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).lean();

    const payload = projects.map((project) => ({
      id: String(project._id),
      name: project.name,
      description: project.description,
      filesCount: project.files.length,
      sharesCount: project.shares.length,
      shares: project.shares.map((share) => ({
        id: String(share._id),
        clientName: share.clientName,
        clientEmail: share.clientEmail,
        token: share.token,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return res.json({ projects: payload });
  } catch (error) {
    return next(error);
  }
});

router.post('/projects', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';

    if (!name) {
      return res.status(400).json({ message: 'Project name is required.' });
    }

    const project = await Project.create({
      name,
      description,
      files: [],
      shares: [],
    });

    return res.status(201).json({
      project: {
        id: String(project._id),
        name: project.name,
        description: project.description,
        filesCount: 0,
        sharesCount: 0,
        shares: [],
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/projects/:projectId/files', uploadProjectFiles, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select('_id files.relativePath').lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const incomingFiles = req.files ?? [];
    if (!incomingFiles.length) {
      return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const relativePaths = [];
    if (Array.isArray(req.body.relativePaths)) {
      relativePaths.push(...req.body.relativePaths);
    } else if (typeof req.body.relativePaths === 'string') {
      relativePaths.push(req.body.relativePaths);
    }

    const mapped = incomingFiles.map((file, index) => ({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype ?? '',
      size: file.size ?? 0,
      relativePath: normalizeRelativePath(relativePaths[index], file.originalname),
    }));

    const existingRelativePaths = new Set(
      (project.files ?? []).map((entry) => normalizeRelativePath(entry.relativePath, entry.relativePath)),
    );
    const seenInBatch = new Set();
    const uniqueMapped = [];
    const duplicateStoredNames = [];

    mapped.forEach((entry) => {
      const relativePath = entry.relativePath;
      if (existingRelativePaths.has(relativePath) || seenInBatch.has(relativePath)) {
        duplicateStoredNames.push(entry.storedName);
        return;
      }

      uniqueMapped.push(entry);
      seenInBatch.add(relativePath);
    });

    if (uniqueMapped.length) {
      await Project.updateOne(
        { _id: project._id },
        { $push: { files: { $each: uniqueMapped } } },
      );
    }

    await cleanupStoredFiles(String(project._id), duplicateStoredNames);

    const [counts] = await Project.aggregate([
      { $match: { _id: project._id } },
      {
        $project: {
          _id: 0,
          filesCount: { $size: '$files' },
        },
      },
    ]);

    return res.status(201).json({
      message: `${uniqueMapped.length} file(s) uploaded.${duplicateStoredNames.length ? ` ${duplicateStoredNames.length} duplicate file(s) skipped.` : ''}`,
      uploadedCount: uniqueMapped.length,
      skippedDuplicateCount: duplicateStoredNames.length,
      filesCount: counts?.filesCount ?? null,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/projects/:projectId/share', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const clientName = typeof req.body.clientName === 'string' ? req.body.clientName.trim() : '';
    const clientEmail = typeof req.body.clientEmail === 'string' ? req.body.clientEmail.trim().toLowerCase() : '';
    const expiresAtRaw = req.body.expiresAt;

    if (!clientName || !clientEmail || !expiresAtRaw) {
      return res.status(400).json({ message: 'clientName, clientEmail, and expiresAt are required.' });
    }

    const expiresAt = new Date(expiresAtRaw);
    if (Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ message: 'Invalid expiresAt value.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const token = createShareToken();
    const share = {
      token,
      clientName,
      clientEmail,
      expiresAt,
      createdAt: new Date(),
    };

    project.shares.push(share);
    await project.save();

    const clientAppUrl = process.env.CLIENT_APP_URL ?? 'http://localhost:5173';
    const projectSlug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return res.status(201).json({
      shareLink: `${clientAppUrl.replace(/\/$/, '')}/view/${projectSlug}/${token}`,
      token,
      projectSlug,
      share,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/projects/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Delete the project's upload folder and all its contents
    const projectUploadDir = path.join(uploadsRoot, projectId);
    try {
      await fs.rm(projectUploadDir, { recursive: true, force: true });
    } catch (fsError) {
      // Log but don't fail — DB record is already deleted
      console.error(`[delete-project] Could not remove upload dir for ${projectId}:`, fsError.message);
    }

    return res.json({ message: 'Project deleted.' });
  } catch (error) {
    return next(error);
  }
});

export default router;
