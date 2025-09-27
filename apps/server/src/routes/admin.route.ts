import express from "express";
import {
    createRole,
    getRoles,
    getRoleById,
    editRole,
    deleteRoleById,
    deleteRolesByIds,
} from "@/controllers/employee/role.controller";

import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    editEmployee,
    deleteEmployeeById,
  } from "@/controllers/employee/employee.controller";
  import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";
import { 
    createProject ,
    editProject,
    deleteProjectById,
    deleteProjectsByIds,
    getAllProjects,
    getProjectById
} from "@/controllers/project/project.controller";
import { editCompanyEmail, editCompanyPassowrd, editCompanyPhone, getCompanyController } from "@/controllers/admin/company.controller";
import { getAdminStats, getBugList, getBugTrendsController, getEmployeeList, getProjectList } from "@/controllers/admin/dashboard.controller"
import { getBugsforDashboard } from "@/services/dashboard.service";

const Router = express.Router();
Router.use(authenticate, authorizeRole(["admin"]));

Router.route("/getCompany").get(getCompanyController);
Router.route("/company/editPhone").put(editCompanyPhone);
Router.route("/company/editEmail").put(editCompanyEmail);
Router.route("/company/updatePassword").put(editCompanyPassowrd);

Router.route("/createRole").post(createRole);
Router.route("/getRoles").get(getRoles);
Router.route("/role/:role_id")
    .get(getRoleById)
    .put(editRole)
    .delete(deleteRoleById);

Router.route("/deleteRoles").delete(deleteRolesByIds);

Router.route("/createEmployee").post(createEmployee);
Router.route("/getAllEmployees").get(getEmployees);
Router.route("/employee/:emp_id")
    .get(getEmployeeById)
    .put(editEmployee)
    .delete(deleteEmployeeById);

Router.route("/get-projects").get(getAllProjects);
Router.route("/createProject").post(createProject);
Router.route("/project/:p_id")
.get(getProjectById)
    .put(editProject)
    .delete(deleteProjectById);

Router.route("/stats").get(getAdminStats);
Router.route("/stats/employees").get(getEmployeeList);
Router.route("/stats/projects").get(getProjectList);
Router.route("/stats/buglist").get(getBugList);
Router.route("/stats/bugtrends").get(getBugTrendsController)

export default Router;
