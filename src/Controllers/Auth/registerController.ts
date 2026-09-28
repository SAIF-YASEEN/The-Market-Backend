import type { Request, Response } from "express";
import { createHash } from "crypto";

import User from "../../Models/User.ts";

import { registerSchema } from "../../Validators/authValidator.js";
import registerService from "../../Services/Auth/registerService.js";

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";

const hashVerificationCode = (
    verificationCode: string,
): string => {
    return createHash("sha256")
        .update(verificationCode)
        .digest("hex");
};

export const registerController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        console.log(
            "register api hit by frontend",
            req.body,
        );

        /*
         * Validate the complete registration data.
         *
         * The frontend now sends:
         * username
         * email
         * password
         * deviceId
         * verificationCode
         */
        const validation =
            registerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid registration data",
                errors:
                    validation.error
                        .flatten()
                        .fieldErrors,
            });

            return;
        }

        const {
            username,
            email,
            password,
            deviceId,
            verificationCode,
        } = validation.data;

        /*
         * Normalize email and username.
         */
        const normalizedEmail =
            email.trim().toLowerCase();

        const normalizedUsername =
            username.trim().toLowerCase();

        /*
         * Verification code is required before
         * the actual registration can continue.
         */
        if (
            !verificationCode ||
            typeof verificationCode !== "string"
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Verification code is required.",
            });

            return;
        }

        /*
         * Verification code must be exactly
         * 6 digits.
         */
        if (
            !/^\d{6}$/.test(
                verificationCode.trim(),
            )
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Verification code must be 6 digits.",
            });

            return;
        }

        /*
         * Find the temporary user created by
         * sendRegistrationVerificationCode.
         */
        const pendingUser = await User.findOne({
            email: normalizedEmail,
        }).select(
            "+emailVerificationCodeHash",
        );

        if (!pendingUser) {
            res.status(400).json({
                success: false,
                message:
                    "Verification request not found. Please request a new code.",
            });

            return;
        }

        /*
         * Make sure this email has not already
         * been verified.
         */
        if (pendingUser.isEmailVerified) {
            res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists.",
            });

            return;
        }

        /*
         * Make sure a verification code exists.
         */
        if (
            !pendingUser.emailVerificationCodeHash
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Verification code not found. Please request a new code.",
            });

            return;
        }

        /*
         * Make sure the verification code has
         * not expired.
         */
        if (
            !pendingUser.emailVerificationCodeExpiresAt ||
            pendingUser.emailVerificationCodeExpiresAt.getTime() <
            Date.now()
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Verification code has expired. Please request a new code.",
            });

            return;
        }

        /*
         * Hash the code entered by the user.
         */
        const enteredCodeHash =
            hashVerificationCode(
                verificationCode.trim(),
            );

        /*
         * Compare the entered code hash with
         * the hash stored in MongoDB.
         */
        if (
            enteredCodeHash !==
            pendingUser.emailVerificationCodeHash
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Invalid verification code.",
            });

            return;
        }

        /*
         * Verification successful.
         *
         * The temporary user exists only because
         * the first verification endpoint needed
         * somewhere to store the code.
         *
         * Remove it before calling registerService
         * so registerService can create the real
         * User account normally.
         */
        await User.deleteOne({
            _id: pendingUser._id,
            isEmailVerified: false,
        });

        /*
         * Use the existing registration service.
         *
         * The actual User account is created here.
         */
        const result = await registerService(
            {
                username: normalizedUsername,
                email: normalizedEmail,
                password,
                deviceId,
            },
            {
                ipAddress:
                    req.ip || "127.0.0.1",
                userAgent:
                    req.get("user-agent"),
            },
        );

        const isProduction =
            process.env.NODE_ENV === "production";

        /*
         * Access Token Cookie
         */
        res.cookie(
            ACCESS_COOKIE_NAME,
            result.accessToken,
            {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction
                    ? "none"
                    : "lax",
                maxAge:
                    15 * 60 * 1000,
                path: "/",
            },
        );

        /*
         * Refresh Token Cookie
         */
        res.cookie(
            REFRESH_COOKIE_NAME,
            result.refreshToken,
            {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction
                    ? "none"
                    : "lax",
                maxAge:
                    90 *
                    24 *
                    60 *
                    60 *
                    1000,
                path: "/",
            },
        );

        /*
         * Registration successful.
         */
        res.status(201).json({
            success: true,
            message:
                "Account created successfully",
            data: {
                user: result.user,
                sessionId:
                    result.sessionId,
                deviceId:
                    result.deviceId,
            },
        });
    } catch (error) {
        console.error(
            "Register controller error:",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Registration failed";

        if (
            message ===
            "Email is already registered" ||
            message ===
            "Username is already taken"
        ) {
            res.status(409).json({
                success: false,
                message,
            });

            return;
        }

        res.status(500).json({
            success: false,
            message:
                "Internal server error",
        });
    }
};