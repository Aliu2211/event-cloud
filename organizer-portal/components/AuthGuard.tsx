"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentUser } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    currentUser().then((user) => {
      if (!active) return;
      if (!user) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-on-surface-variant">Loading console...</p>
      </div>
    );
  }

  return <>{children}</>;
}
