"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type SupplierRole = "manager" | "pm" | "worker";

interface SupplierRoleContextType {
  role: SupplierRole;
  setRole: (role: SupplierRole) => void;
  userName: string;
}

const roleNames: Record<SupplierRole, string> = {
  manager: "张总",
  pm: "王经理",
  worker: "标注员小李",
};

const SupplierRoleContext = createContext<SupplierRoleContextType | null>(null);

export function SupplierRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<SupplierRole>("pm");

  return (
    <SupplierRoleContext.Provider value={{ role, setRole, userName: roleNames[role] }}>
      {children}
    </SupplierRoleContext.Provider>
  );
}

export function useSupplierRole() {
  const ctx = useContext(SupplierRoleContext);
  if (!ctx) throw new Error("useSupplierRole must be used within SupplierRoleProvider");
  return ctx;
}
