import User from "../../Models/User.js";
import Session from "../../Models/Session.js";
import RefreshToken from "../../Models/RefreshToken.js";
import DeviceToken from "../../Models/DeviceToken.js";

import { generateAccessToken } from "../../Utils/Register/jwt.js";
import { generateRefreshToken } from "../../Utils/Register/refreshToken.js";
import { hashToken } from "../../Utils/Register/hash.js";

export interface RefreshResult {
    user: {
        id: string;
        username: string;
        email: string;
        role: string;
    };

    accessToken: string;
    refreshToken: string;
}

const refreshService = async (
    refreshToken: string,
    metadata: {
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<RefreshResult> => {

    // ---------------------------------------------
    // 1. HASH RECEIVED REFRESH TOKEN
    // ---------------------------------------------

    const refreshTokenHash = hashToken(refreshToken);

    // ---------------------------------------------
    // 2. FIND REFRESH TOKEN
    // ---------------------------------------------

    const existingRefreshToken =
        await RefreshToken.findOne({
            tokenHash: refreshTokenHash,
        });

    if (!existingRefreshToken) {
        throw new Error("Invalid refresh token");
    }

    // ---------------------------------------------
    // 3. CHECK TOKEN REVOCATION
    // ---------------------------------------------

    if (existingRefreshToken.isRevoked) {
        throw new Error("Refresh token has been revoked");
    }

    // ---------------------------------------------
    // 4. CHECK TOKEN EXPIRATION
    // ---------------------------------------------

    if (
        existingRefreshToken.expiresAt.getTime() <
        Date.now()
    ) {
        throw new Error("Refresh token has expired");
    }

    // ---------------------------------------------
    // 5. FIND USER
    // ---------------------------------------------

    const user = await User.findById(
        existingRefreshToken.userId
    );

    if (!user) {
        throw new Error("User not found");
    }

    // ---------------------------------------------
    // 6. CHECK USER STATUS
    // ---------------------------------------------

    if (!user.isActive) {
        throw new Error("User account is inactive");
    }

    // ---------------------------------------------
    // 7. FIND SESSION
    // ---------------------------------------------

    const session = await Session.findOne({
        sessionId: existingRefreshToken.sessionId,
        userId: user._id,
    });

    if (!session) {
        throw new Error("Session not found");
    }

    // ---------------------------------------------
    // 8. CHECK SESSION REVOCATION
    // ---------------------------------------------

    if (session.isRevoked) {
        throw new Error("Session has been revoked");
    }

    // ---------------------------------------------
    // 9. CHECK SESSION EXPIRATION
    // ---------------------------------------------

    if (
        session.expiresAt.getTime() <
        Date.now()
    ) {
        throw new Error("Session has expired");
    }

    // ---------------------------------------------
    // 10. CHECK TOKEN VERSION
    // ---------------------------------------------

    if (
        existingRefreshToken.tokenVersion !==
        user.tokenVersion
    ) {
        throw new Error("Token version is invalid");
    }

    // ---------------------------------------------
    // 11. REVOKE OLD REFRESH TOKEN
    // ---------------------------------------------

    existingRefreshToken.isRevoked = true;

    await existingRefreshToken.save();

    // ---------------------------------------------
    // 12. CREATE NEW REFRESH TOKEN
    // ---------------------------------------------

    const newRefreshToken =
        generateRefreshToken();

    const newRefreshTokenHash =
        hashToken(newRefreshToken);

    const newRefreshTokenDocument =
        await RefreshToken.create({
            userId: user._id,
            sessionId: existingRefreshToken.sessionId,
            tokenHash: newRefreshTokenHash,
            tokenFamily: existingRefreshToken.tokenFamily,
            tokenVersion: user.tokenVersion,
            issuedAt: new Date(),

            // Keep the original session expiration.
            expiresAt: existingRefreshToken.expiresAt,

            isRevoked: false,
        });

    // ---------------------------------------------
    // 13. UPDATE SESSION
    // ---------------------------------------------

    session.lastUsedAt = new Date();

    if (metadata.ipAddress) {
        session.ipAddress = metadata.ipAddress;
    }

    if (metadata.userAgent) {
        session.userAgent = metadata.userAgent;
    }

    await session.save();

    // ---------------------------------------------
    // 14. UPDATE DEVICE TOKEN
    // ---------------------------------------------

    await DeviceToken.findOneAndUpdate(
        {
            userId: user._id,
            sessionId: existingRefreshToken.sessionId,
        },
        {
            refreshTokenId:
                newRefreshTokenDocument._id,

            lastUsedAt: new Date(),
        }
    );

    // ---------------------------------------------
    // 15. CREATE NEW ACCESS TOKEN
    // ---------------------------------------------

    const accessToken = generateAccessToken({
        userId: user._id.toString(),
        sessionId: existingRefreshToken.sessionId,
        role: user.role,
        tokenVersion: user.tokenVersion,
    });

    // ---------------------------------------------
    // 16. RETURN RESULT
    // ---------------------------------------------

    return {
        user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
        },

        accessToken,
        refreshToken: newRefreshToken,
    };
};

export default refreshService;