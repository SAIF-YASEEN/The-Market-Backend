import { Router } from "express";

import { registerController } from './../Controllers/Auth/register';

const authRouter = Router();

authRouter.post(
  "/register",
  registerController
);

export default authRouter;