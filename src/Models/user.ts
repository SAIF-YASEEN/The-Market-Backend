import mongoose, {
    Document,
    Schema,
} from "mongoose";

export type UserRole =
    | "CUSTOMER"
    | "SELLER"
    | "ADMIN";

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash?: string | null;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    emailVerificationCodeHash?: string | null;
    emailVerificationCodeExpiresAt?: Date | null;
    tokenVersion: number;
    lastLoginAt?: Date;
    passwordChangedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            lowercase: true,
            index: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },

        /*
         * Password is not available during
         * the email-verification stage.
         *
         * It will be added by the final
         * registration API.
         */
        passwordHash: {
            type: String,
            required: false,
            default: null,
            select: false,
        },

        role: {
            type: String,
            enum: [
                "CUSTOMER",
                "SELLER",
                "ADMIN",
            ],
            default: "CUSTOMER",
            index: true,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        /*
         * Hashed verification code.
         *
         * We NEVER store the actual
         * 6-digit code in MongoDB.
         */
        emailVerificationCodeHash: {
            type: String,
            default: null,
        },

        /*
         * Exact expiration time of
         * the verification code.
         */
        emailVerificationCodeExpiresAt: {
            type: Date,
            default: null,
        },

        tokenVersion: {
            type: Number,
            default: 0,
        },

        lastLoginAt: {
            type: Date,
        },

        passwordChangedAt: {
            type: Date,
        },
    },

    {
        timestamps: true,
    },
);

const User = mongoose.model<IUser>(
    "User",
    userSchema,
);

export default User;