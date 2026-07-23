"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props =
  | { mode: "generate"; taskId: string; logId?: never; label?: string }
  | { mode: "pay"; logId: string; taskId?: never; label?: string };

export default function SettlementActionButton(props: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const url = props.mode === "generate"
        ? `/api/settlement/tasks/${props.taskId}/generate`
        : `/api/settlement/logs/${props.logId}/pay`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "操作失败");
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={props.mode === "generate" ? "reviewBtn primary" : "linkBtn"} onClick={run} disabled={loading}>
      {loading ? "处理中..." : props.label || (props.mode === "generate" ? "生成结算" : "标记付款")}
    </button>
  );
}