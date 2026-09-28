import type { Request, Response } from "express";

import { registerSchema } from "../../Validators/authValidator";
import authService from "../../Services/authServices";
const REFRESH_COOKIE_NAME = "refreshToken";

export const registerController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        console.log("register apihiited by frontend ",req.body)
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid registration data",
                errors: validation.error.flatten().fieldErrors,
            });

            return;
        }

        const result = await authService.register(
            validation.data,
            {
                ipAddress: req.ip || "103.102.157.155",
                userAgent: req.get("user-agent"),
            }
        );

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
            path: "/api/v1/auth",
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: {
                user: result.user,
                accessToken: result.accessToken,
                sessionId: result.sessionId,
                deviceId: result.deviceId,
            },
        });
    } catch (error) {
        console.error("Register controller error:", error);

        const message =
            error instanceof Error
                ? error.message
                : "Registration failed";

        if (
            message === "Email is already registered" ||
            message === "Username is already taken"
        ) {
            res.status(409).json({
                success: false,
                message,
            });

            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};