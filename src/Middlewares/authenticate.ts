import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AccessTokenPayload {
    userId: string;
    sessionId: string;
    role: string;
    tokenVersion: number;
}

export interface AuthenticatedRequest extends Request {
    user?: AccessTokenPayload;
}

const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        // ---------------------------------------------
        // 1. GET ACCESS TOKEN FROM HTTP-ONLY COOKIE
        // ---------------------------------------------

        const accessToken = req.cookies?.accessToken;

        // ---------------------------------------------
        // 2. ACCESS TOKEN NOT FOUND
        // ---------------------------------------------

        if (!accessToken) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });

            return;
        }

        // ---------------------------------------------
        // 3. GET JWT SECRET
        // ---------------------------------------------

        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret) {
            console.error(
                "JWT_ACCESS_SECRET is not defined"
            );

            res.status(500).json({
                success: false,
                message: "Authentication configuration error",
            });

            return;
        }

        // ---------------------------------------------
        // 4. VERIFY ACCESS TOKEN
        // ---------------------------------------------

        const decoded = jwt.verify(
            accessToken,
            secret
        ) as AccessTokenPayload;

        // ---------------------------------------------
        // 5. STORE AUTHENTICATED USER DATA
        // ---------------------------------------------

        req.user = decoded;

        // ---------------------------------------------
        // 6. ALLOW REQUEST TO CONTROLLER
        // ---------------------------------------------

        next();

    } catch (error) {
        // ---------------------------------------------
        // INVALID / EXPIRED TOKEN
        // ---------------------------------------------

        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: "Access token expired",
            });

            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: "Invalid access token",
            });

            return;
        }

        console.error(
            "Authentication middleware error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

export default authenticate;