import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  if (!session?.user) return null;

  const roleLabels: Record<string, { label: string; color: string }> = {
    ADMIN: {
      label: "Sistem Yöneticisi",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    STORE_MANAGER: {
      label: "Mağaza Müdürü",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    WAREHOUSE_MANAGER: {
      label: "Depo Sorumlusu",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  };

  const userRole = (session.user as any).role || "USER";
  const badge = roleLabels[userRole] || {
    label: userRole,
    color: "bg-zinc-800 text-zinc-300 border-zinc-700",
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo ve Başlık */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            SmartStock
          </span>
          <span className="text-xs px-2 py-0.5 rounded border font-mono font-medium border-zinc-700 text-zinc-400">
            v1.0
          </span>
        </div>

        {/* Kullanıcı Profili ve Rol Bilgisi */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-zinc-200">
              {session.user.name || session.user.email}
            </span>
            <span className="text-xs text-zinc-500">{session.user.email}</span>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${badge.color}`}
          >
            {badge.label}
          </span>

          <div className="h-6 w-px bg-zinc-800" />

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
