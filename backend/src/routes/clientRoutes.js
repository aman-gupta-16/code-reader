import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { Project } from '../models/Project.js';
import { buildFileTree, isTextFile, normalizeRelativePath } from '../utils/projectUtils.js';

const router = express.Router();
const uploadsRoot = path.resolve(process.cwd(), 'uploads');

async function resolveProjectByToken(token) {
  const project = await Project.findOne({ 'shares.token': token });
  if (!project) {
    return null;
  }

  const share = project.shares.find((entry) => entry.token === token);
  if (!share) {
    return null;
  }

  return { project, share };
}

function buildProjectResponse(project, share) {
  return {
    id: String(project._id),
    name: project.name,
    description: project.description,
    clientName: share.clientName,
    clientEmail: share.clientEmail,
    expiresAt: share.expiresAt,
    filesCount: project.files.length,
    tree: buildFileTree(project.files),
  };
}

// New slug-based format: GET /project/:projectSlug/:token
router.get('/project/:projectSlug/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const found = await resolveProjectByToken(token);

    if (!found) {
      return res.status(404).json({ message: 'Shared project not found.' });
    }

    const { project, share } = found;
    if (new Date(share.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: 'This shared project link has expired.' });
    }

    return res.json({ project: buildProjectResponse(project, share) });
  } catch (error) {
    return next(error);
  }
});

// New slug-based file fetch: GET /project/:projectSlug/:token/file/:fileId
router.get('/project/:projectSlug/:token/file/:fileId', async (req, res, next) => {
  try {
    const { token, fileId } = req.params;
    const found = await resolveProjectByToken(token);

    if (!found) {
      return res.status(404).json({ message: 'Shared project not found.' });
    }

    const { project, share } = found;
    if (new Date(share.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: 'This shared project link has expired.' });
    }

    const fileEntry = project.files.id(fileId);
    if (!fileEntry) {
      return res.status(404).json({ message: 'File not found in project.' });
    }

    const normalized = normalizeRelativePath(fileEntry.relativePath, fileEntry.originalName);
    if (!isTextFile(normalized)) {
      return res.status(415).json({ message: 'This file type is not available in read-only viewer mode.' });
    }

    const absolutePath = path.join(uploadsRoot, String(project._id), fileEntry.storedName);
    const content = await fs.readFile(absolutePath, 'utf-8');

    return res.json({
      file: {
        id: String(fileEntry._id),
        name: path.basename(normalized),
        path: normalized,
        size: fileEntry.size,
        content,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Legacy token-only route for backward compatibility: GET /project/:token
router.get('/project/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const found = await resolveProjectByToken(token);

    if (!found) {
      return res.status(404).json({ message: 'Shared project not found.' });
    }

    const { project, share } = found;
    if (new Date(share.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: 'This shared project link has expired.' });
    }

    return res.json({ project: buildProjectResponse(project, share) });
  } catch (error) {
    return next(error);
  }
});

// Legacy file route for old tokens: GET /project/:token/file/:fileId
router.get('/project/:token/file/:fileId', async (req, res, next) => {
  try {
    const { token, fileId } = req.params;
    const found = await resolveProjectByToken(token);

    if (!found) {
      return res.status(404).json({ message: 'Shared project not found.' });
    }

    const { project, share } = found;
    if (new Date(share.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: 'This shared project link has expired.' });
    }

    const fileEntry = project.files.id(fileId);
    if (!fileEntry) {
      return res.status(404).json({ message: 'File not found in project.' });
    }

    const normalized = normalizeRelativePath(fileEntry.relativePath, fileEntry.originalName);
    if (!isTextFile(normalized)) {
      return res.status(415).json({ message: 'This file type is not available in read-only viewer mode.' });
    }

    const absolutePath = path.join(uploadsRoot, String(project._id), fileEntry.storedName);
    const content = await fs.readFile(absolutePath, 'utf-8');

    return res.json({
      file: {
        id: String(fileEntry._id),
        name: path.basename(normalized),
        path: normalized,
        size: fileEntry.size,
        content,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
