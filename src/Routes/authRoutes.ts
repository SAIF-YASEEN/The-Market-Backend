import { Router } from "express";

import { registerController } from '../Controllers/Auth/registerController';
import { refreshController } from "../Controllers/Auth/refreshController";
import { sendRegistrationVerificationCode } from "../Controllers/Auth/sendRegistrationVerificationCode";
const authRoutes = Router();

authRoutes.post(
  "/register",
  registerController
);

authRoutes.post("/refresh", refreshController);
authRoutes.post("/send-registration-verification-code", sendRegistrationVerificationCode);
export default authRoutes;