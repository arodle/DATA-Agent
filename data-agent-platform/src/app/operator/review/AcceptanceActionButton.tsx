"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  taskId: string;
  action: "approve" | "reject";
  label: string;
  className?: string;
};

export default function AcceptanceActionButton({ taskId, action, label, className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/acceptance/tasks/${taskId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "approve"
          ? JSON.stringify({ note: "运营验收通过，交付批次完成。" })
          : JSON.stringify({ reason: "抽检存在问题，需供应商返修后重新提交。" }),
      });
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
    <button className={className || "reviewBtn"} onClick={run} disabled={loading}>
      {loading ? "处理中..." : label}
    </button>
  );
}