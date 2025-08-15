import { Router } from "express";
import { registerCompanyController } from "../controllers/admin/company.controller";

const router = Router();

router.route("/company/register").post(registerCompanyController);

export default router;
