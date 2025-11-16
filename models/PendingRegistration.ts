import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPendingRegistration extends Document {
  email: string;
  password: string;
  name?: string;
  verificationCode: string;
  expiresAt: Date;
  createdAt: Date;
}

const PendingRegistrationSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    verificationCode: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

const PendingRegistration: Model<IPendingRegistration> = 
  mongoose.models.PendingRegistration || 
  mongoose.model<IPendingRegistration>('PendingRegistration', PendingRegistrationSchema);

export default PendingRegistration;

