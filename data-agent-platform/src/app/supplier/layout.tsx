"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SupplierRoleProvider, useSupplierRole, SupplierRole } from "./SupplierRoleContext";
import SupplierAgentFull from "./SupplierAgentFull";
import SupplierAgentWorker from "./SupplierAgentWorker";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: SupplierRole[];
}

const navConfig: NavItem[] = [
  { label: "任务管理", href: "/supplier", icon: "📋", roles: ["manager", "pm", "worker"] },
  { label: "任务拆分", href: "/supplier/split", icon: "🔀", roles: ["manager"] },
  { label: "标采执行", href: "/supplier/annotation", icon: "✏️", roles: ["pm", "worker"] },
  { label: "需求方对话", href: "/supplier/chat/project-vehicle-2d", icon: "💬", roles: ["pm"] },
  { label: "标注规则", href: "/supplier/rules", icon: "📐", roles: ["pm", "worker"] },
  { label: "质量分析", href: "/supplier/quality", icon: "📊", roles: ["manager", "pm"] },
  { label: "团队管理", href: "/supplier/team", icon: "👥", roles: ["manager"] },
  { label: "数据交付", href: "/supplier/delivery", icon: "📦", roles: ["manager", "pm", "worker"] },
  { label: "结算记录", href: "/supplier/settlement", icon: "💰", roles: ["manager"] },
];

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useSupplierRole();

  const isWorkspace = /^\/supplier\/annotation\/[^/]+$/.test(pathname);
  const visibleNav = navConfig.filter((item) => item.roles.includes(role));

  const isActive = (href: string) =>
    href === "/supplier" ? pathname === "/supplier" : pathname.startsWith(href);

  return (
    <main className={`roleShell supplierShell ${isWorkspace ? "workspaceMode" : ""}`}>
      {!isWorkspace && (
        <aside className="roleSidebar">
          <div className="roleBrand">Data Agent / 供应商</div>

          <div className="sRoleToggle">
            <button
              className={`sRoleBtn ${role === "manager" ? "active" : ""}`}
              onClick={() => setRole("manager")}
            >
              负责人
            </button>
            <button
              className={`sRoleBtn ${role === "pm" ? "active" : ""}`}
              onClick={() => setRole("pm")}
            >
              项目经理
            </button>
            <button
              className={`sRoleBtn ${role === "worker" ? "active" : ""}`}
              onClick={() => setRole("worker")}
            >
              标注员
            </button>
          </div>

          <nav className="roleNav">
            {visibleNav.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={isActive(item.href) ? "roleNavItem active" : "roleNavItem"}
              >
                <span className="navIcon">{item.icon}</span>
                <span className="navLabel">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="roleSwitcher">
            <span>切换角色</span>
            <div className="roleLinks">
              <Link href="/user">用户</Link>
              <Link href="/operator">运营</Link>
              <Link href="/supplier" className="active">供应商</Link>
            </div>
          </div>
        </aside>
      )}

      <section className={`roleWorkspace ${isWorkspace ? "full" : ""}`}>
        {children}
      </section>

      {(role === "manager" || role === "pm") && !isWorkspace && <SupplierAgentFull role={role} />}
      {role === "worker" && !isWorkspace && <SupplierAgentWorker />}
    </main>
  );
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupplierRoleProvider>
      <LayoutInner>{children}</LayoutInner>
    </SupplierRoleProvider>
  );
}
