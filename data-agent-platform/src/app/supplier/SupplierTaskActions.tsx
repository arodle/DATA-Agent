"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  taskId: string;
  status: string;
};

export default function SupplierTaskActions({ taskId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const call = async (action: "start" | "submit") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/supplier/tasks/${taskId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "submit" ? JSON.stringify({ summary: "供应商提交交付批次，等待平台验收。" }) : "{}",
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "操作失败");
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "操作失败");
    } finally {
      setLoading(null);
    }
  };

  if (status === "PUBLISHED" || status === "DRAFT") {
    return <button className="linkBtn" onClick={() => call("start")} disabled={!!loading}>{loading === "start" ? "启动中..." : "启动"}</button>;
  }

  if (status === "RUNNING") {
    return <button className="linkBtn" onClick={() => call("submit")} disabled={!!loading}>{loading === "submit" ? "提交中..." : "提交交付"}</button>;
  }

  return <span style={{ color: "#697889", fontSize: 12 }}>-</span>;
}