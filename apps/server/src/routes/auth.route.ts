import { Router } from "express";
import { loginController } from "../controllers/auth/auth.controller";
import { registerCompanyController } from "../controllers/admin/company.controller";

const router = Router();

router.route("/login").post(loginController);
router.route("/registerCompany").post(registerCompanyController);

export default router;
