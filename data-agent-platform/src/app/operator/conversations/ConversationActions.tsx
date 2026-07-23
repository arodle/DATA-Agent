"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionKind = "suggestion" | "review" | "preview" | "createRequirement";

type Props = {
  kind: ActionKind;
  conversationId: string;
  requirementId?: string;
  suggestionId?: string;
  suggestionType?: string;
  suggestionTitle?: string;
  suggestionContent?: string;
  action?: string;
  label: string;
  confirmText?: string;
  primary?: boolean;
};

const text = {
  failed: "\u64cd\u4f5c\u5931\u8d25",
  saved: "\u64cd\u4f5c\u5df2\u8bb0\u5f55",
  loading: "\u5904\u7406\u4e2d...",
  preview: "\u9879\u76ee\u9884\u89c8\u5df2\u751f\u6210",
  project: "\u4e2a\u9879\u76ee",
  newTitle: "\u8bf7\u8f93\u5165 Requirement \u6807\u9898",
  created: "Requirement \u8349\u7a3f\u5df2\u521b\u5efa",
};

export default function ConversationActionButton({
  kind,
  conversationId,
  requirementId,
  suggestionId,
  suggestionType,
  suggestionTitle,
  suggestionContent,
  action,
  label,
  confirmText,
  primary,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const endpoint = () => {
    if (kind === "createRequirement") return `/api/operator/conversations/${encodeURIComponent(conversationId)}/requirements`;
    if (kind === "suggestion") return `/api/operator/conversations/${encodeURIComponent(conversationId)}/suggestions/${encodeURIComponent(suggestionId || "")}`;
    if (kind === "review") return `/api/operator/conversations/${encodeURIComponent(conversationId)}/requirements/${encodeURIComponent(requirementId || "")}/review`;
    return `/api/operator/conversations/${encodeURIComponent(conversationId)}/requirements/${encodeURIComponent(requirementId || "")}/project-preview`;
  };

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    const title = kind === "createRequirement" ? window.prompt(text.newTitle) : undefined;
    if (kind === "createRequirement" && !title?.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          decision: action,
          mode: action,
          title,
          requirementId,
          suggestionType,
          suggestionTitle,
          suggestionContent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const missing = data.missingFields?.length ? `: ${data.missingFields.join(", ")}` : "";
        throw new Error((data.error || text.failed) + missing);
      }
      if (kind === "preview") {
        window.alert(`${text.preview}: ${data.preview?.projectCount || 0} ${text.project}`);
      } else if (kind === "createRequirement" || data.requirement?.id) {
        window.alert(text.created);
      } else {
        window.alert(text.saved);
      }
      router.refresh();
    } catch (error: any) {
      window.alert(error?.message || text.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className={primary ? "primary" : ""} disabled={loading} onClick={run}>
      {loading ? text.loading : label}
    </button>
  );
}