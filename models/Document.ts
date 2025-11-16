import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  chapterOrder?: number;
  chapterTitle?: string;
  extractedText?: string;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    chapterOrder: {
      type: Number,
    },
    chapterTitle: {
      type: String,
    },
    extractedText: {
      type: String,
    },
    processed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const DocumentModel: Model<IDocument> = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default DocumentModel;

