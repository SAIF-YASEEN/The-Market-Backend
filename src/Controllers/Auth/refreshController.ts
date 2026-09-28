import type { Request, Response } from "express";

import refreshService from "../../Services/Auth/refreshService.js";
const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";

export const refreshController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        console.log("req comes to refrsh token controller", req.cookies, req.body)
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: "Refresh token is missing",
            });
            return;
        }

        const result = await refreshService(
            refreshToken,
            {
                ipAddress: req.ip || "127.0.0.1",
                userAgent: req.get("user-agent"),
            }
        );

        const isProduction =
            process.env.NODE_ENV === "production";

        // New access token
        res.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
        });

        // New rotated refresh token
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
            path: "/",
        });

        res.status(200).json({
            success: true,
            message: "Authentication refreshed successfully",
            data: {
                user: result.user,
            },
        });
    } catch (error) {
        console.error("Refresh controller error:", error);

        res.clearCookie(ACCESS_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            path: "/",
        });

        res.clearCookie(REFRESH_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            path: "/",
        });

        res.status(401).json({
            success: false,
            message: "Authentication session is invalid or expired",
        });
    }
};