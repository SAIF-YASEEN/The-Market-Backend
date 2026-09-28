import crypto from "crypto";

export const generateSecureDeviceToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};