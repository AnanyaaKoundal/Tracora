import { create } from "zustand";

interface AuthState {
  employeeId: string | null;
  companyId: string | null;
  role: string | null;
  setAuth: (data: { employeeId: string; companyId: string; role: string }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  employeeId: null,
  companyId: null,
  role: null,

  setAuth: ({ employeeId, companyId, role }: {employeeId:any, companyId: any, role:any}) =>
    set({ employeeId, companyId, role }),

  clearAuth: () => set({ employeeId: null, companyId: null, role: null }),
}));
