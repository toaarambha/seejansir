import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/portfolio";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Student Records — Aarambha Academy" },
      { name: "description", content: "All students documented across portfolios and class batches." },
      { property: "og:title", content: "Student Records" },
      { property: "og:description", content: "Students documented in activity portfolios." },
    ],
  }),
  component: Students,
});

function Students() {
  const { portfolios, batches } = useStore();
  const [q, setQ] = useState("");
  const map = new Map<string, { name: string; cls: string; section: string; roll: string; count: number; subjects: Set<string> }>();
  for (const p of [...portfolios, ...batches.flatMap((b) => b.students)]) {
    if (!p.studentName.trim()) continue;
    const key = `${p.studentName.trim().toLowerCase()}|${p.className}|${p.section}`;
    const r = map.get(key) ?? { name: p.studentName.trim(), cls: p.className, section: p.section, roll: p.roll, count: 0, subjects: new Set<string>() };
    r.count++;
    if (p.subject) r.subjects.add(p.subject);
    map.set(key, r);
  }
  const rows = [...map.values()].filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.cls.localeCompare(b.cls) || a.name.localeCompare(b.name));
  return (
    <AppShell>
      <PageTitle title="Student records" sub={`${map.size} students documented`} />
      <div className="panel">
        <Input className="mb-4 max-w-sm" placeholder="Search student…" value={q} onChange={(e) => setQ(e.target.value)} />
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No students yet.</p> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Class</th><th>Roll</th><th>Portfolios</th><th>Subjects</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}><td className="font-medium text-foreground">{r.name}</td><td>{r.cls}{r.section && ` - ${r.section}`}</td><td>{r.roll}</td><td>{r.count}</td><td>{[...r.subjects].join(", ")}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
