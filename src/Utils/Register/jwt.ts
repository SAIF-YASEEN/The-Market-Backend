import jwt from "jsonwebtoken";

interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  role: string;
  tokenVersion: number;
}

export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "15m",
  });
};