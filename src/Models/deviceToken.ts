import mongoose, {
    Document,
    Schema,
} from "mongoose";

export interface IDeviceToken extends Document {
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    deviceId: string;
    refreshTokenId?: mongoose.Types.ObjectId;

    secureDeviceToken: string;

    deviceName?: string;
    platform: "WEB" | "ANDROID" | "IOS";
    browser?: string;

    userAgent: string;
    ipAddress: string;

    country?: string;
    city?: string;
    timezone?: string;

    lastUsedAt: Date;
    remembered: boolean;

    expiresAt: Date;
    isRevoked: boolean;
    revokedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
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

        deviceId: {
            type: String,
            required: true,
            index: true,
        },

        refreshTokenId: {
            type: Schema.Types.ObjectId,
            ref: "RefreshToken",
            index: true,
        },

        secureDeviceToken: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },

        deviceName: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        platform: {
            type: String,
            enum: ["WEB", "ANDROID", "IOS"],
            default: "WEB",
            required: true,
        },

        browser: {
            type: String,
            trim: true,
        },

        userAgent: {
            type: String,
            default: "unknown",
        },

        ipAddress: {
            type: String,
            default: "unknown",
        },

        country: {
            type: String,
            default: null,
        },

        city: {
            type: String,
            default: null,
        },

        timezone: {
            type: String,
            default: null,
        },

        lastUsedAt: {
            type: Date,
            default: Date.now,
        },

        remembered: {
            type: Boolean,
            default: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        isRevoked: {
            type: Boolean,
            default: false,
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

deviceTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const DeviceToken = mongoose.model<IDeviceToken>(
    "DeviceToken",
    deviceTokenSchema
);

export default DeviceToken;