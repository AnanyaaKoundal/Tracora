import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

export const generateCompanyId = () => {
  return `CMP-${nanoid()}`;
};

export const generateEmployeeId = () => {
  return `EMP-${nanoid()}`;
}

export const generateProjectId = () => {
  return `PRJ-${nanoid()}`;
}

export const generateBugId = () => {
  return `B-${nanoid()}`;
}