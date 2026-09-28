import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISession extends Document {
  userId: Types.ObjectId;

  sessionId: string;

  deviceId: string;

  deviceName?: string;
  platform?: string;
  browser?: string;

  ipAddress?: string;
  userAgent?: string;

  tokenVersion: number;

  isRevoked: boolean;

  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    deviceName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    platform: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    browser: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    ipAddress: {
      type: String,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      maxlength: 1000,
    },

    tokenVersion: {
      type: Number,
      required: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model<ISession>("Session", sessionSchema);

export default Session;