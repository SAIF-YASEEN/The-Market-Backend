import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(
            3,
            "Username must be at least 3 characters",
        )
        .max(
            30,
            "Username cannot exceed 30 characters",
        )
        .toLowerCase(),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .toLowerCase(),

    password: z
        .string()
        .min(
            8,
            "Password must be at least 8 characters",
        )
        .max(
            128,
            "Password cannot exceed 128 characters",
        ),

    deviceId: z
        .string()
        .uuid("Invalid device ID"),

    verificationCode: z
        .string()
        .trim()
        .regex(
            /^\d{6}$/,
            "Verification code must be 6 digits",
        ),
});

export type RegisterInput =
    z.infer<typeof registerSchema>;