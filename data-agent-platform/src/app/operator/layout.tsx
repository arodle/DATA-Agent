"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import OperatorAgent from "./OperatorAgent";

type NavItem = {
  label: string;
  href?: string;
  children?: Array<{ label: string; href: string }>;
};

const labels = {
  brand: "Data Agent / \u8fd0\u8425\u7aef",
  home: "\u9996\u9875",
  collection: "\u91c7\u96c6\u7ba1\u7406",
  annotation: "\u6807\u6ce8\u7ba1\u7406",
  conversation: "Conversation",
  quality: "\u8d28\u91cf\u4e2d\u5fc3",
  suppliers: "\u4f9b\u5e94\u5546\u7ba1\u7406",
  agentConsole: "AI Agent \u4e2d\u53f0",
  consoleHome: "\u4e2d\u53f0\u9996\u9875",
  knowledgeAssets: "\u77e5\u8bc6\u8d44\u4ea7",
  knowledgeGraph: "\u77e5\u8bc6\u56fe\u8c31",
  knowledgeOperation: "\u77e5\u8bc6\u8fd0\u8425",
  retrospectives: "\u7ecf\u9a8c\u590d\u76d8",
  rag: "RAG \u8c03\u8bd5",
  models: "\u6a21\u578b\u7ba1\u7406",
  monitor: "\u8fd0\u884c\u76d1\u63a7",
  finance: "\u8d39\u7528\u7ba1\u7406",
  settings: "\u7cfb\u7edf\u8bbe\u7f6e",
  user: "\u7528\u6237",
  operator: "\u8fd0\u8425",
  supplier: "\u4f9b\u5e94\u5546",
};

const navConfig: NavItem[] = [
  { label: labels.home, href: "/operator" },
  { label: labels.collection, href: "/operator/collection" },
  { label: labels.annotation, href: "/operator/annotation" },
  { label: labels.conversation, href: "/operator/conversations" },
  { label: labels.quality, href: "/operator/quality" },
  { label: labels.suppliers, href: "/operator/suppliers" },
  {
    label: labels.agentConsole,
    children: [
      { label: labels.consoleHome, href: "/operator/agent-console" },
      { label: labels.knowledgeAssets, href: "/operator/agent-console/knowledge/assets" },
      { label: labels.knowledgeGraph, href: "/operator/agent-console/knowledge/graph" },
      { label: labels.knowledgeOperation, href: "/operator/agent-console/knowledge/operation" },
      { label: labels.retrospectives, href: "/operator/agent-console/knowledge/retrospectives" },
      { label: labels.rag, href: "/operator/agent-console/rag" },
      { label: labels.models, href: "/operator/agent-console/models" },
      { label: labels.monitor, href: "/operator/agent-console/monitor" },
    ],
  },
  { label: labels.finance, href: "/operator/finance" },
  { label: labels.settings, href: "/operator/settings" },
];

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/operator" ? pathname === "/operator" : pathname === href || pathname.startsWith(href + "/");

  const isGroupActive = (item: NavItem) => item.children?.some((child) => isActive(child.href)) ?? false;

  return (
    <main className="roleShell operatorShell operatorProjectShell operatorUnifiedShell">
      <header className="operatorTopNav">
        <Link href="/operator" className="operatorTopBrand">{labels.brand}</Link>
        <nav className="operatorTopItems">
          {navConfig.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className={`operatorTopGroup ${isGroupActive(item) ? "active" : ""}`}>
                  <Link href={item.children[0]?.href || "/operator/agent-console"} className="operatorTopGroupLabel">{item.label}</Link>
                  <div className="operatorTopMenu">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className={isActive(child.href) ? "active" : ""}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href || "/operator"} className={item.href && isActive(item.href) ? "active" : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="operatorTopRoles">
          <Link href="/user">{labels.user}</Link>
          <span>{labels.operator}</span>
          <Link href="/supplier">{labels.supplier}</Link>
        </div>
      </header>
      <section className="roleWorkspace operatorProjectWorkspace operatorUnifiedWorkspace">
        {children}
      </section>
      <OperatorAgent />
    </main>
  );
}