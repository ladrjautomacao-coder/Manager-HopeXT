import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Visão geral", url: "/", icon: LayoutDashboard, end: true },
  { title: "Clientes", url: "/clientes", icon: Building2 },
];

const HOPEXT_LOGO_URL = "https://emzqlctomlsjwmgthbkv.supabase.co/storage/v1/object/public/tenant-logos/hopext-default.png";

export function Layout() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img src={HOPEXT_LOGO_URL} alt="HopeXT" className="h-7 w-7 rounded-full object-cover" />
              <span className="text-lg font-bold tracking-tight">Portal HopeXT</span>
            </div>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
