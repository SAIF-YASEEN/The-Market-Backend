import type { Request, Response } from "express";
import { createHash } from "crypto";

import User from "../../Models/User.ts";

import {
    sendRegistrationVerificationEmail,
} from "../../Services/Auth/email.service.ts";

const VERIFICATION_CODE_EXPIRY_MINUTES = 10;

const generateVerificationCode = (): string => {
    return Math.floor(
        100000 + Math.random() * 900000,
    ).toString();
};

const hashVerificationCode = (
    verificationCode: string,
): string => {
    return createHash("sha256")
        .update(verificationCode)
        .digest("hex");
};

export const sendRegistrationVerificationCode = async (
    req: Request,
    res: Response,
): Promise<Response> => {
    try {
        const { username, email } = req.body;

        /*
         * Validate username
         */
        if (
            !username ||
            typeof username !== "string" ||
            !username.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Username is required.",
            });
        }

        /*
         * Validate email
         */
        if (
            !email ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Email address is required.",
            });
        }

        const normalizedUsername =
            username.trim().toLowerCase();

        const normalizedEmail =
            email.trim().toLowerCase();

        /*
         * Basic email format validation
         */
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address.",
            });
        }

        /*
         * Check whether this email already
         * belongs to a verified account.
         */
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (
            existingUser &&
            existingUser.isEmailVerified
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists.",
            });
        }

        /*
         * Check whether the username is already
         * being used by another account.
         */
        const existingUsername = await User.findOne({
            username: normalizedUsername,
        });

        if (
            existingUsername &&
            existingUsername._id.toString() !==
            existingUser?._id.toString()
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This username is already taken.",
            });
        }

        /*
         * Generate a new 6-digit verification code.
         */
        const verificationCode =
            generateVerificationCode();

        /*
         * Hash the verification code before
         * storing it in the database.
         */
        const verificationCodeHash =
            hashVerificationCode(
                verificationCode,
            );

        /*
         * Code expires after 10 minutes.
         */
        const verificationCodeExpiresAt =
            new Date(
                Date.now() +
                VERIFICATION_CODE_EXPIRY_MINUTES *
                60 *
                1000,
            );

        /*
         * If an unverified user record already
         * exists, update the verification data.
         *
         * Otherwise create a temporary user record.
         */
        if (existingUser) {
            existingUser.username =
                normalizedUsername;

            existingUser.emailVerificationCodeHash =
                verificationCodeHash;

            existingUser.emailVerificationCodeExpiresAt =
                verificationCodeExpiresAt;

            existingUser.isEmailVerified = false;

            await existingUser.save();
        } else {
            await User.create({
                username: normalizedUsername,
                email: normalizedEmail,
                passwordHash: null,
                isEmailVerified: false,
                emailVerificationCodeHash:
                    verificationCodeHash,
                emailVerificationCodeExpiresAt:
                    verificationCodeExpiresAt,
            });
        }

        /*
         * Send the RAW verification code through EmailJS.
         *
         * The raw code is sent to the user's email,
         * but only its SHA-256 hash is stored in MongoDB.
         */
        await sendRegistrationVerificationEmail({
            email: normalizedEmail,
            username: normalizedUsername,
            verificationCode,
        });

        /*
         * Successful response.
         */
        return res.status(200).json({
            success: true,
            message:
                "Verification code sent to your email.",
        });
    } catch (error) {
        console.error(
            "Send registration verification code error:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send verification code. Please try again.",
        });
    }
};