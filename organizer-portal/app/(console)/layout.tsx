import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-[240px] flex flex-col min-h-screen">{children}</div>
      </div>
    </AuthGuard>
  );
}
