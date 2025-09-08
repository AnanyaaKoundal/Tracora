import { Router } from "express";
import { getAllCompaniesController, loginController, logout, verifyLoginOtpController } from "../controllers/auth/auth.controller";
import { registerCompanyController, verifyOtpAndRegisterCompanyController } from "../controllers/admin/company.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();

router.route("/login").post(loginController);
router.route("/registerCompany").post(registerCompanyController);
router.route("/company/verify").post(verifyOtpAndRegisterCompanyController);
router.route("/getCompanies").get(getAllCompaniesController);
router.route("/verifyOtp").post(verifyLoginOtpController);
router.route("/logout").post(authenticate, logout);

export default router;
