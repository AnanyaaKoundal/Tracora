import { Router } from "express";
import { loginController } from "../controllers/auth/auth.controller";
import { registerCompanyController, verifyOtpAndRegisterCompanyController } from "../controllers/admin/company.controller";

const router = Router();

router.route("/login").post(loginController);
router.route("/registerCompany").post(registerCompanyController);
router.route("/company/verify").post(verifyOtpAndRegisterCompanyController);

export default router;
