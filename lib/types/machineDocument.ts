import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMachineDocument extends Document {
  title: string;
  type: 'file' | 'link';
  linkUrl: string;
  driveFileId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  categoryId?: Types.ObjectId;
  manufacturerId?: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  folderId?: string;
  isActive: boolean;
}

const MachineDocumentSchema = new Schema<IMachineDocument>({
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['file', 'link'] },
  linkUrl: { type: String, required: true },
  driveFileId: { type: String },
  fileName: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  categoryId: { type: Schema.Types.ObjectId, ref: 'DocumentCategory' },
  manufacturerId: { type: Schema.Types.ObjectId, ref: 'Manufacturer' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IMachineDocument>('MachineDocument', MachineDocumentSchema);
