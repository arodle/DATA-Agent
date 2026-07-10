"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navConfig = [
  { label: "用户工作台", href: "/user/workspace", icon: "🏠" },
  { label: "Agent 控制", href: "/user/agent", icon: "🤖" },
  { label: "数据资产", href: "/user/data", icon: "📊" },
  { label: "算力资源", href: "/user/compute", icon: "⚡" },
  { label: "模型中心", href: "/user/models", icon: "🧠" },
  {
    label: "标采项目",
    icon: "📁",
    children: [
      { label: "标注任务", href: "/user/annotation" },
      { label: "采集任务", href: "/user/collection" },
    ],
  },
  { label: "帮助中心", href: "/user/help", icon: "❓" },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [projectOpen, setProjectOpen] = useState(true);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <main className="roleShell userShell">
      <aside className="roleSidebar">
        <div className="roleBrand">Data Agent / 用户端</div>
        <nav className="roleNav">
          {navConfig.map((item) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.label}>
                  <button
                    className={`subNavHeader ${projectOpen ? "open" : ""}`}
                    onClick={() => setProjectOpen(!projectOpen)}
                  >
                    <span className="navIcon">{item.icon}</span>
                    <span className="navLabel">{item.label}</span>
                    <span className="navArrow">{projectOpen ? "▾" : "▸"}</span>
                  </button>
                  {projectOpen && (
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
              </Link>
            );
          })}
        </nav>
        <div className="roleSwitcher">
          <span>切换角色</span>
          <div className="roleLinks">
            <Link href="/user" className="active">用户</Link>
            <Link href="/operator">运营</Link>
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
