import User from "../Models/User.js";
import Session from "../Models/Session.js";
import RefreshToken from "../Models/RefreshToken.js";
import crypto from "crypto";
import DeviceToken from "../Models/DeviceToken.js";
import { hashPassword } from "../Utils/Register/password.js";
import { generateAccessToken } from "../Utils/Register/jwt.js";
import {
    generateRefreshToken,
    generateTokenFamily,
} from "../Utils/Register/refreshToken.js";
import { hashToken } from "../Utils/Register/hash.js";
import { RegisterInput } from "../Validators/authValidator.js";
import { generateSecureDeviceToken } from './../Utils/Register/secureDeviceToken';

interface RegisterResult {
    user: {
        id: string;
        username: string;
        email: string;
        role: string;
    };

    accessToken: string;
    refreshToken: string;
    sessionId: string;
    deviceId: string;
}

const REFRESH_TOKEN_DAYS = 90;

const authService = {
    register: async (
        data: RegisterInput,
        metadata: {
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<RegisterResult> => {
        const existingUser = await User.findOne({
            $or: [
                { email: data.email },
                { username: data.username },
            ],
        });

        if (existingUser) {
            if (existingUser.email === data.email) {
                throw new Error("Email is already registered");
            }

            throw new Error("Username is already taken");
        }

        const passwordHash = await hashPassword(data.password);

        const user = await User.create({
            username: data.username,
            email: data.email,
            passwordHash,
            role: "CUSTOMER",
            isActive: true,
            isEmailVerified: false,
            tokenVersion: 0,
        });

        const deviceId = data.deviceId;
        const sessionId = crypto.randomUUID();
        const tokenFamily = generateTokenFamily();

        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);

        const expiresAt = new Date();

        expiresAt.setDate(
            expiresAt.getDate() + REFRESH_TOKEN_DAYS
        );

        await Session.create({
            userId: user._id,
            sessionId,
            deviceId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            tokenVersion: user.tokenVersion,
            isRevoked: false,
            lastUsedAt: new Date(),
            expiresAt,
        });

        const refreshTokenDocument = await RefreshToken.create({
            userId: user._id,
            sessionId,
            tokenHash: refreshTokenHash,
            tokenFamily,
            tokenVersion: user.tokenVersion,
            issuedAt: new Date(),
            expiresAt,
            isRevoked: false,
        });

        const secureDeviceToken =
            generateSecureDeviceToken();

        await DeviceToken.create({
            userId: user._id,
            sessionId,
            deviceId: data.deviceId,
            refreshTokenId: refreshTokenDocument._id,
            secureDeviceToken,
            platform: "WEB",
            userAgent: metadata.userAgent ?? "unknown",
            ipAddress: metadata.ipAddress ?? "unknown",
            lastUsedAt: new Date(),
            remembered: true,
            expiresAt,
            isRevoked: false,
        });
        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            sessionId,
            role: user.role,
            tokenVersion: user.tokenVersion,
        });

        return {
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role,
            },

            accessToken,
            refreshToken,
            sessionId,
            deviceId,
        };
    },
};

export default authService;