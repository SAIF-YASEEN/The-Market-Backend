import crypto from "crypto";

export const generateDeviceId = (): string => {
  return crypto.randomUUID();
};