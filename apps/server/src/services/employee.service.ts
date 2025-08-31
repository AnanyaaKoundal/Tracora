import { v4 as uuidv4 } from "uuid";
import Employee from "../models/employee.model";
import ApiError from "../utils/ApiError";
import Role from "@/models/role.model";

// Create user
export const createEmployee = async (userData: any) => {
    const { email, roleId } = userData;
  
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      throw new ApiError(400, "Employee already exists");
    }
  
    // if (!Array.isArray(roleId)) {
    //   throw new ApiError(400, "role_id must be an array of role IDs");
    // }
  
    const newEmployee = await Employee.create({
      user_id: uuidv4(),
      ...userData,
    });
  
    return newEmployee;
  };
  
  export const createAdminEmployee = async (userData: any) => {
    const { email, roleId } = userData;
  
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      throw new ApiError(400, "Employee already exists");
    }
  
    const role = await Role.findOne({role_name: 'admin'});
    if(!role){
      throw new ApiError(400, "Admin role not found. Please create admin role first.");
    }
  
    const newEmployee = await Employee.create({
      user_id: uuidv4(),
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
