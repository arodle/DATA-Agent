"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  projectId: string;
  label?: string;
  className?: string;
};

export default function RetrospectiveActionButton({ projectId, label = "生成复盘", className = "linkBtn" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/retrospectives/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "生成复盘失败");
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "生成复盘失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={className} onClick={run} disabled={loading}>
      {loading ? "生成中..." : label}
    </button>
  );
}
