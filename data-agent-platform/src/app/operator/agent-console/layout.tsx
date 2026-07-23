"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navConfig = [
  {
    section: "工作台",
    items: [
      { label: "Dashboard", href: "/operator/agent-console", icon: "总" },
    ],
  },
  {
    section: "Agent 构建",
    items: [
      { label: "Agent Studio", href: "/operator/agent-console/studio", icon: "建" },
      { label: "测试与发布", href: "/operator/agent-console/test", icon: "测" },
      { label: "运行监控", href: "/operator/agent-console/monitor", icon: "监" },
    ],
  },
  {
    section: "知识运营",
    items: [
      { label: "知识运营中心", href: "/operator/agent-console/knowledge/operation", icon: "运" },
      { label: "知识资产中心", href: "/operator/agent-console/knowledge/assets", icon: "知" },
      { label: "知识关系图谱", href: "/operator/agent-console/knowledge/graph", icon: "图" },
      { label: "经验复盘", href: "/operator/agent-console/knowledge/retrospectives", icon: "复" },
    ],
  },
  {
    section: "AI 能力",
    items: [
      { label: "RAG 检索中心", href: "/operator/agent-console/rag", icon: "搜" },
      { label: "模型服务", href: "/operator/agent-console/models", icon: "模" },
    ],
  },
  {
    section: "系统",
    items: [
      { label: "权限与审计", href: "/operator/agent-console/settings", icon: "权" },
    ],
  },
];

export default function AgentConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/operator/agent-console"
      ? pathname === "/operator/agent-console"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="agxShell">
      <header className="agxTopbar">
        <div className="agxTopbarLeft">
          <div className="agxBrand">
            <span className="agxBrandIcon">AI</span>
            <div>
              <div className="agxBrandTitle">AI Agent 中台</div>
              <div className="agxBrandSub">数据标采智能运营平台</div>
            </div>
          </div>
        </div>
        <div className="agxTopbarCenter">
          <div className="agxTopbarStat">
            <span className="agxTopbarStatLabel">知识资产</span>
            <span className="agxTopbarStatValue">2,847</span>
          </div>
          <div className="agxTopbarStat">
            <span className="agxTopbarStatLabel">RAG 命中率</span>
            <span className="agxTopbarStatValue good">94.2%</span>
          </div>
          <div className="agxTopbarStat">
            <span className="agxTopbarStatLabel">Agent 状态</span>
            <span className="agxTopbarStatValue">
              <span className="agxStatusDot" /> 运行中
            </span>
          </div>
        </div>
        <div className="agxTopbarRight">
          <div className="agxUserChip">
            <span className="agxUserAvatar">L</span>
            <div>
              <div className="agxUserName">李运营</div>
              <div className="agxUserRole">Administrator</div>
            </div>
          </div>
        </div>
      </header>

      <div className="agxBody">
        <aside className="agxSidebar">
          <nav className="agxNav">
            {navConfig.map((section) => (
              <div key={section.section} className="agxNavSection">
                <div className="agxNavHeader">{section.section}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive(item.href) ? "agxNavItem active" : "agxNavItem"}
                  >
                    <span className="agxNavIcon">{item.icon}</span>
                    <span className="agxNavLabel">{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="agxMain">{children}</main>
      </div>
    </div>
  );
}