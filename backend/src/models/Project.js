import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProjectFileSchema = new Schema(
  {
    relativePath: { type: String, required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: true },
);

const ShareSchema = new Schema(
  {
    token: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    files: { type: [ProjectFileSchema], default: [] },
    shares: { type: [ShareSchema], default: [] },
  },
  {
    timestamps: true,
  },
);

ProjectSchema.index({ 'shares.token': 1 });

export const Project = mongoose.model('Project', ProjectSchema);
