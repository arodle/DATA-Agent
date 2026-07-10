"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navConfig = [
  { label: "运营工作台", href: "/operator", icon: "🏠" },
  { label: "项目管理", href: "/operator/projects", icon: "📁" },
  { label: "审核中心", href: "/operator/review", icon: "✅", badge: "12" },
  { label: "Agent管理", href: "/operator/agent", icon: "🤖" },
  {
    label: "质量监控",
    icon: "📊",
    badge: "47",
    children: [
      { label: "质量事件", href: "/operator/quality" },
      { label: "缺陷分析", href: "/operator/quality/defects" },
    ],
  },
  { label: "供应商管理", href: "/operator/suppliers", icon: "🏭" },
  { label: "操作日志", href: "/operator/logs", icon: "📝" },
  { label: "权限管理", href: "/operator/permissions", icon: "🔒" },
];

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [qualityOpen, setQualityOpen] = useState(true);

  const isActive = (href: string) =>
    href === "/operator" ? pathname === "/operator" : pathname === href || pathname.startsWith(href + "/");

  return (
    <main className="roleShell operatorShell">
      <aside className="roleSidebar">
        <div className="roleBrand">Data Agent / 运营端</div>
        <nav className="roleNav">
          {navConfig.map((item) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.label}>
                  <button
                    className={`subNavHeader ${qualityOpen ? "open" : ""}`}
                    onClick={() => setQualityOpen(!qualityOpen)}
                  >
                    <span className="navIcon">{item.icon}</span>
                    <span className="navLabel">{item.label}</span>
                    {item.badge && <span className="navBadge">{item.badge}</span>}
                    <span className="navArrow">{qualityOpen ? "▾" : "▸"}</span>
                  </button>
                  {qualityOpen && (
                    <div className="subNavItems">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={isActive(child.href) ? "subNavItem active" : "subNavItem"}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "roleNavItem active" : "roleNavItem"}
              >
                <span className="navIcon">{item.icon}</span>
                <span className="navLabel">{item.label}</span>
                {item.badge && <span className="navBadge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="roleSwitcher">
          <span>切换角色</span>
          <div className="roleLinks">
            <Link href="/user">用户</Link>
            <Link href="/operator" className="active">运营</Link>
            <Link href="/supplier">供应商</Link>
          </div>
        </div>
      </aside>
      <section className="roleWorkspace">
        {children}
      </section>
    </main>
  );
}
