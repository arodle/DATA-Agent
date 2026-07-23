"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  actionId?: string;
  projectId?: string;
  mode: "create-preview" | "authorize" | "reject";
  label: string;
  className?: string;
};

export default function AgentActionButton({ actionId, projectId, mode, label, className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const url =
        mode === "create-preview"
          ? "/api/agent/action/preview"
          : `/api/agent/action/${actionId}/${mode}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "create-preview"
            ? {
                projectId,
                requirement: "生成一条供应商可执行的数据标采任务，进入运营授权队列。",
                taskName: "Agent 自动生成 - 数据标采试运行批次",
                dataVolume: 5000,
                stage: "ANNOTATION",
                executorType: "SUPPLIER",
              }
            : mode === "reject"
              ? { reason: "运营暂不通过，需要补充方案信息。" }
              : {},
        ),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "Action failed");
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={className || "reviewBtn"} onClick={run} disabled={loading}>
      {loading ? "处理中..." : label}
    </button>
  );
}