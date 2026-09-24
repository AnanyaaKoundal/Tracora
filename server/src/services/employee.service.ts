import { v4 as uuidv4 } from "uuid";
import Employee from "../models/employee.model";
import Project from "@/models/project.model";
import ApiError from "../utils/ApiError";
import Role from "@/models/role.model";
import { generateEmployeeId } from "./id.service";

// Create user
export const createEmployee = async (userData: any) => {
  const { employee_email, employee_contact_number, roleId, company_id } = userData;
  
  const existingEmployeeByEmail = await Employee.findOne({ employee_email, company_id });
  if (existingEmployeeByEmail) {
    throw new ApiError(400, "Employee with this email already exists for this company");
  }

  if (employee_contact_number) {
    const existingEmployeeByMobile = await Employee.findOne({ employee_contact_number, company_id });
    if (existingEmployeeByMobile) {
      throw new ApiError(400, "Employee with this mobile number already exists for this company");
    }
  }

  if (!Array.isArray(roleId)) {
    throw new ApiError(400, "role_id must be an array of role IDs");
  }

  if (roleId && roleId.length > 0) {
    const roles = await Role.find({ role_id: { $in: roleId }, company_id });
    if (roles.length !== roleId.length) {
      throw new ApiError(400, "One or more roles not found for this company");
    }
  }

  const employee_id = generateEmployeeId();
  const newEmployee = await Employee.create({
    employee_id,
    ...userData,
  });

  return newEmployee;
};

export const createAdminEmployee = async (userData: any) => {
  const { employee_email, company_id } = userData;

  const existingEmployee = await Employee.findOne({ employee_email, company_id });
  if (existingEmployee) {
    throw new ApiError(400, "Employee already exists");
  }

  const role = await Role.findOne({ role_name: 'admin', company_id });
  if (!role) {
    throw new ApiError(400, "Admin role not found for this company");
  }
  const employee_id = generateEmployeeId();
  const newEmployee = await Employee.create({
    employee_id,
    roleId: [role.role_id],
    ...userData,
  });

  return newEmployee;
};

// Get all users
export const getEmployees = async (company_id?: string) => {
  const query = company_id ? { company_id } : {};
  const employees = await Employee.find(query);

  const enrichedEmployees = await Promise.all(
    employees.map(async (employee) => {
      const project = employee.projectId
        ? await Project.findOne({ project_id: employee.projectId })
        : null;

      const roles = employee.roleId?.length
        ? await Role.find({ role_id: { $in: employee.roleId }, company_id })
        : [];

      return {
        ...employee.toObject(),
        project_name: project ? project.project_name : null,
        role_names: roles.map((r) => r.role_name),
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
  const existingUser = await Employee.findOne({ employee_id });
  if (!existingUser) {
    throw new ApiError(404, "Employee not found");
  }

  const { employee_email, employee_contact_number, company_id } = updateData;

  if (employee_email && employee_email !== existingUser.employee_email) {
    const duplicateEmail = await Employee.findOne({ employee_email, company_id, employee_id: { $ne: employee_id } });
    if (duplicateEmail) {
      throw new ApiError(400, "Employee with this email already exists for this company");
    }
  }

  if (employee_contact_number && employee_contact_number !== existingUser.employee_contact_number) {
    const duplicateMobile = await Employee.findOne({ employee_contact_number, company_id, employee_id: { $ne: employee_id } });
    if (duplicateMobile) {
      throw new ApiError(400, "Employee with this mobile number already exists for this company");
    }
  }

  const user = await Employee.findOneAndUpdate(
    { employee_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

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

export const getAllAssignees = async (company_id?: string) => {
  const query = company_id ? { company_id } : {};
  const employees = await Employee.find(query).select("employee_id employee_name employee_email");

  if (!employees || employees.length === 0) {
    throw new ApiError(404, "No employees found");
  }

  return employees;
};