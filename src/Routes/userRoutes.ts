import { Router } from "express";

import authenticate from "../Middlewares/authenticate.js";
import { getMeController } from "../Controllers/User/getMeController.js";
const userRoutes = Router();

userRoutes.get("/me", authenticate, getMeController);

export default userRoutes;