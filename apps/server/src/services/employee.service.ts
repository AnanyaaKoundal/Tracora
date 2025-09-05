import { v4 as uuidv4 } from "uuid";
import Employee from "../models/employee.model";
import ApiError from "../utils/ApiError";
import Role from "@/models/role.model";
import { generateEmployeeId } from "./id.service";

// Create user
export const createEmployee = async (userData: any) => {
    const { email, roleId } = userData;
  
    const existingEmployee = await Employee.findOne({ email });
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
  
    const role = await Role.findOne({role_name: 'admin'});
    if(!role){
      throw new ApiError(400, "Admin role not found. Please create admin role first.");
    }
  
    const newEmployee = await Employee.create({
      employee_id: uuidv4(),
      roleId: [role.role_id],
      ...userData,
    });
  
    return newEmployee;
  };

// Get all users
export const getEmployees = async () => {
  return await Employee.find();
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
export const editEmployee = async (user_id: string, updateData: any) => {
  const user = await Employee.findOneAndUpdate(
    { user_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  return user;
};

// Delete user
export const deleteEmployeeById = async (user_id: string) => {
  const user = await Employee.findOneAndDelete({ user_id });

  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  return user;
};

export const getRoleName = async (employee_id: string) => {
  const emp = await Employee.findOne({ employee_id });
  console.log("INNNN \n Employee: ", emp);
  if (!emp) {
    throw new ApiError(404, "Employee not found");
  }

  // since roleId is stored as an array of string IDs
  const role = await Role.findOne({role_id: emp.roleId[0]});  
  console.log("Role: ", role);
  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role.role_name;
};