import mongoose, { Document, Schema } from "mongoose";

export interface IRefreshToken extends Document {
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    tokenHash: string;
    tokenFamily: string;
    tokenVersion: number;
    issuedAt: Date;
    expiresAt: Date;
    usedAt?: Date;
    revokedAt?: Date;
    replacedByTokenId?: mongoose.Types.ObjectId;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
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
            index: true,
        },

        tokenHash: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },

        tokenFamily: {
            type: String,
            required: true,
            index: true,
        },

        tokenVersion: {
            type: Number,
            required: true,
        },

        issuedAt: {
            type: Date,
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        usedAt: {
            type: Date,
        },

        revokedAt: {
            type: Date,
        },

        replacedByTokenId: {
            type: Schema.Types.ObjectId,
            ref: "RefreshToken",
        },

        isRevoked: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

refreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const RefreshToken = mongoose.model<IRefreshToken>(
    "RefreshToken",
    refreshTokenSchema
);

export default RefreshToken;