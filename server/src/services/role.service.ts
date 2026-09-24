import { v4 as uuidv4 } from "uuid";
import Role from "../models/role.model";
import ApiError from "../utils/ApiError";
import Employee from "@/models/employee.model";

const DEFAULT_ROLES = [
  { role_name: "admin", is_admin: true, is_default: true },
  { role_name: "manager", is_admin: false, is_default: true },
  { role_name: "developer", is_admin: false, is_default: true },
  { role_name: "tester", is_admin: false, is_default: true },
];

export const seedDefaultRoles = async (company_id: string) => {
  const existingRoles = await Role.find({ company_id });
  if (existingRoles.length > 0) {
    return existingRoles;
  }

  const createdRoles = [];
  
  for (const role of DEFAULT_ROLES) {
    const existingRole = await Role.findOne({ role_name: role.role_name, company_id });
    if (existingRole) {
      createdRoles.push(existingRole);
      continue;
    }
    
    const newRole = await Role.create({
      role_id: uuidv4(),
      role_name: role.role_name,
      company_id,
      is_admin: role.is_admin,
      is_default: role.is_default,
    });
    createdRoles.push(newRole);
  }

  return createdRoles;
};

export const createRole = async (userData: any) => {
  const { role_name, company_id } = userData;

  if (!company_id) {
    throw new ApiError(400, "Company ID is required");
  }

  const existingRole = await Role.findOne({ role_name, company_id });
  if (existingRole) {
    throw new ApiError(400, "Role already exists for this company");
  }

  const newRole = await Role.create({
    role_id: uuidv4(),
    role_name,
    company_id,
    is_default: false,
    is_admin: false,
  });

  return newRole;
};

export const getRoles = async (company_id?: string) => {
  const query = company_id ? { company_id } : {};
  const roles = await Role.find(query);
  return roles;
};

export const getRoleById = async (role_id: string) => {
  const role = await Role.findOne({ role_id });

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
};

export const getCompanyAdminRole = async (company_id: string) => {
  const role = await Role.findOne({ company_id, is_admin: true });
  return role;
};

export const editRole = async (role_id: string, updateData: any) => {
  const existingRole = await Role.findOne({ role_id });
  if (!existingRole) {
    throw new ApiError(404, "Role not found");
  }

  if (existingRole.is_admin) {
    throw new ApiError(403, "Cannot edit admin role");
  }

  const { role_name, ...otherUpdates } = updateData;

  if (role_name) {
    const duplicateCheck = await Role.findOne({
      role_name,
      company_id: existingRole.company_id,
      role_id: { $ne: role_id },
    });
    if (duplicateCheck) {
      throw new ApiError(400, "Role name already exists for this company");
    }
  }

  const role = await Role.findOneAndUpdate(
    { role_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  return role;
};

export const deleteRoleById = async (role_id: string) => {
  const role = await Role.findOne({ role_id });
  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (role.is_admin) {
    throw new ApiError(403, "Cannot delete admin role");
  }

  const assignedEmployee = await Employee.findOne({ roleId: role_id });
  if (assignedEmployee) {
    throw new ApiError(400, "Cannot delete role. Employees are assigned to it.");
  }

  const deletedRole = await Role.findOneAndDelete({ role_id });

  return deletedRole;
};

export const deleteRolesByIds = async (roleIds: string[]) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new ApiError(400, "No role IDs provided");
    }

    const roles = await Role.find({ role_id: { $in: roleIds } });
    const adminRoles = roles.filter(r => r.is_admin);
    if (adminRoles.length > 0) {
      throw new ApiError(403, "Cannot delete admin role(s)");
    }

    const rolesWithEmployees = await Employee.find({ roleId: { $in: roleIds } });
    if (rolesWithEmployees.length > 0) {
      throw new ApiError(400, "Cannot delete role(s). Employees are assigned to them.");
    }
  
    const result = await Role.deleteMany({ role_id: { $in: roleIds } });
  
    if (result.deletedCount === 0) {
      throw new ApiError(404, "No roles deleted");
    }
  
    return { deletedCount: result.deletedCount };
  };