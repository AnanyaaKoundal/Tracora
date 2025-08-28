import { v4 as uuidv4 } from "uuid";
import User from "../models/employee.model";
import ApiError from "../utils/ApiError";

// Create user
export const createUser = async (userData: any) => {
    const { email, roleId } = userData;
  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }
  
    if (!Array.isArray(roleId)) {
      throw new ApiError(400, "role_id must be an array of role IDs");
    }
  
    const newUser = await User.create({
      user_id: uuidv4(),
      ...userData,
    });
  
    return newUser;
  };
  

// Get all users
export const getUsers = async () => {
  return await User.find();
};

// Get user by ID
export const getUserById = async (user_id: string) => {
  const user = await User.findOne({ user_id });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// Edit user
export const editUser = async (user_id: string, updateData: any) => {
  const user = await User.findOneAndUpdate(
    { user_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// Delete user
export const deleteUserById = async (user_id: string) => {
  const user = await User.findOneAndDelete({ user_id });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};
