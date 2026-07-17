"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            router.push("/user/workspace");
            break;
          case "2":
            e.preventDefault();
            router.push("/operator");
            break;
          case "3":
            e.preventDefault();
            router.push("/supplier");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
