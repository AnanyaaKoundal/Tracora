import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

export const generateCompanyId = () => {
  return `CMP-${nanoid()}`;
};
