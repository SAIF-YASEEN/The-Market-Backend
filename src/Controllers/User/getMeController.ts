import type { Response } from "express";
import User from "../../Models/User.js";
import { AuthenticatedRequest } from "../../Middlewares/authenticate.js";
export const getMeController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        console.log("getme testing", req.body, req.user)
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }

        const user = await User.findById(userId).select(
            "_id username email role"
        );

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "User information fetched successfully",
            data: {
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        console.error("Get me controller error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user information",
        });
    }
};