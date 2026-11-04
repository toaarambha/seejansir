import { createFileRoute, Link } from "@tanstack/react-router";
import { FilePlus2, Layers, FileText, Users } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { displayName, useStore } from "@/lib/portfolio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Aarambha Academy Portfolio Maker" },
      { name: "description", content: "Create printable A4 student activity portfolios for Aarambha Academy." },
      { property: "og:title", content: "Aarambha Academy Portfolio Maker" },
      { property: "og:description", content: "Create printable A4 student activity portfolios." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { portfolios, batches } = useStore();
  const all = [...portfolios, ...batches.flatMap((b) => b.students)];
  const students = new Set(all.map((p) => `${p.studentName.trim().toLowerCase()}|${p.className}`).filter((s) => s !== "|"));
  const recent = [...portfolios].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  return (
    <AppShell>
      <PageTitle title="Namaste, teacher" sub="Document your students' learning activities in three photographs.">
        <Button asChild><Link to="/create" search={{}}><FilePlus2 />Create New Portfolio</Link></Button>
        <Button asChild variant="secondary"><Link to="/bulk" search={{}}><Layers />Bulk Generate</Link></Button>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={FileText} label="Portfolios created" value={all.length} />
        <Stat icon={Users} label="Students documented" value={students.size} />
        <Stat icon={Layers} label="Class batches" value={batches.length} />
      </div>
      <div className="panel mt-6">
        <h3 className="form-heading mb-3">Recent portfolios</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No portfolios yet. Start by creating one.</p>
        ) : (
          <ul className="divide-y">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span><b className="text-foreground">{displayName(p)}</b> <span className="text-muted-foreground">· Class {p.className} · {p.subject || "—"}</span></span>
                <Link to="/create" search={{ id: p.id }} className="text-primary hover:underline">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="panel flex items-center gap-4">
      <div className="stat-icon"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="font-display text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
