"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      const tag = document.activeElement?.tagName;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag || ""))
        router.refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
