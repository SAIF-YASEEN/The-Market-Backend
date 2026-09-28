import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;

    role: UserRole;

    isActive: boolean;
    isEmailVerified: boolean;

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

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: ["CUSTOMER", "SELLER", "ADMIN"],
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
    }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;