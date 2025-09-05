import { v4 as uuidv4 } from "uuid";
import Role from "../models/role.model";
import ApiError from "../utils/ApiError";

export const createRole = async (userData: any) => {
  const { role_name } = userData;

  const existingRole = await Role.findOne({ role_name });
  if (existingRole) {
    throw new ApiError(400, "Role already exists");
  }

  const newRole = await Role.create({
    role_id: uuidv4(),
    role_name,
  });

  return newRole;
};

export const getRoles = async () => {
  console.log("Fetching roles");
  const roles = await Role.find();
  console.log("Role: ",roles);
  return roles;
};

export const getRoleById = async (role_id: string) => {
  const role = await Role.findOne({ role_id });

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
};

export const editRole = async (role_id: string, updateData: any) => {
  const role = await Role.findOneAndUpdate(
    { role_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
};

export const deleteRoleById = async (role_id: string) => {
  const role = await Role.findOneAndDelete({ role_id });

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
};

export const deleteRolesByIds = async (roleIds: string[]) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new ApiError(400, "No role IDs provided");
    }
  
    const result = await Role.deleteMany({ role_id: { $in: roleIds } });
  
    if (result.deletedCount === 0) {
      throw new ApiError(404, "No roles deleted");
    }
  
    return { deletedCount: result.deletedCount };
  };