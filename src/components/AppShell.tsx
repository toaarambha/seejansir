import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, FilePlus2, Layers, FolderOpen, Users, Settings } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/create", label: "Create New Portfolio", icon: FilePlus2 },
  { to: "/bulk", label: "Bulk Generator", icon: Layers },
  { to: "/saved", label: "Saved Portfolios", icon: FolderOpen },
  { to: "/students", label: "Student Records", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sidebar">
        <div className="px-5 py-6">
          <div className="font-display text-lg font-bold leading-tight text-sidebar-foreground">Aarambha Academy</div>
          <div className="text-xs text-sidebar-foreground/60">Activity Portfolio Maker</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="nav-link" activeProps={{ className: "nav-link-active" }} activeOptions={{ exact: n.to === "/" }}>
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
