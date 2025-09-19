import { v4 as uuidv4 } from "uuid";
import Employee from "../models/employee.model";
import Project from "@/models/project.model";
import ApiError from "../utils/ApiError";
import Role from "@/models/role.model";
import { generateEmployeeId } from "./id.service";

// Create user
export const createEmployee = async (userData: any) => {
  const { employee_email, roleId } = userData;
  const existingEmployee = await Employee.findOne({ employee_email });
  if (existingEmployee) {
    throw new ApiError(400, "Employee already exists");
  }

  if (!Array.isArray(roleId)) {
    throw new ApiError(400, "role_id must be an array of role IDs");
  }
  const employee_id = generateEmployeeId();
  const newEmployee = await Employee.create({
    employee_id,
    ...userData,
  });

  return newEmployee;
};

export const createAdminEmployee = async (userData: any) => {
  const { employee_email } = userData;

  const existingEmployee = await Employee.findOne({ employee_email });
  if (existingEmployee) {
    throw new ApiError(400, "Employee already exists");
  }

  const role = await Role.findOne({ role_name: 'admin' });
  if (!role) {
    throw new ApiError(400, "Admin role not found. Please create admin role first.");
  }
  const employee_id = generateEmployeeId();
  const newEmployee = await Employee.create({
    employee_id: uuidv4(),
    roleId: [role.role_id],
    ...userData,
  });

  return newEmployee;
};

// Get all users
export const getEmployees = async () => {
  const employees = await Employee.find();

  const enrichedEmployees = await Promise.all(
    employees.map(async (employee) => {
      // Fetch project
      const project = employee.projectId
        ? await Project.findOne({ project_id: employee.projectId })
        : null;

      // Fetch roles (since roleId is an array)
      const roles = employee.roleId?.length
        ? await Role.find({ role_id: { $in: employee.roleId } })
        : [];

      return {
        ...employee.toObject(),
        project_name: project ? project.project_name : null,
        role_names: roles.map((r) => r.role_name), // collect all role names
      };
    })
  );
  return enrichedEmployees;
};


// Get user by ID
export const getEmployeeById = async (user_id: string) => {
  const user = await Employee.findOne({ user_id });

  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  return user;
};

// Edit user
export const editEmployee = async (employee_id: string, updateData: any) => {
  const user = await Employee.findOneAndUpdate(
    { employee_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  return user;
};

// Delete user
export const deleteEmployeeById = async (employee_id: string) => {
  const user = await Employee.findOneAndDelete({ employee_id });

  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  return user;
};

export const getRoleName = async (employee_id: string) => {
  const emp = await Employee.findOne({ employee_id });
  if (!emp) {
    throw new ApiError(404, "Employee not found");
  }

  // since roleId is stored as an array of string IDs
  const role = await Role.findOne({ role_id: emp.roleId[0] });
  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role.role_name;
};

export const getAllAssignees = async () => {
  // 1️⃣ Get admin role ID(s)
  const adminRole = await Role.findOne({ role_name: "admin" });
  if (!adminRole) {
    throw new ApiError(404, "Admin role not found");
  }

  // 2️⃣ Find employees whose roleId array does NOT contain adminRole.role_id
  const employees = await Employee.find({
    roleId: { $ne: adminRole.role_id },
  }).select("employee_id employee_name employee_email");

  if (!employees || employees.length === 0) {
    throw new ApiError(404, "No employees found");
  }

  return employees;
};