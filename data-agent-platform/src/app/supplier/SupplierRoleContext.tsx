"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type SupplierRole = "manager" | "worker";

interface SupplierRoleContextType {
  role: SupplierRole;
  setRole: (role: SupplierRole) => void;
  userName: string;
}

const SupplierRoleContext = createContext<SupplierRoleContextType | null>(null);

export function SupplierRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<SupplierRole>("manager");

  return (
    <SupplierRoleContext.Provider value={{ role, setRole, userName: role === "manager" ? "张三" : "李四" }}>
      {children}
    </SupplierRoleContext.Provider>
  );
}

export function useSupplierRole() {
  const ctx = useContext(SupplierRoleContext);
  if (!ctx) throw new Error("useSupplierRole must be used within SupplierRoleProvider");
  return ctx;
}
