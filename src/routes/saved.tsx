import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteBatch, deletePortfolio, displayName, useStore } from "@/lib/portfolio";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Portfolios — Aarambha Academy" },
      { name: "description", content: "Reopen, edit, re-export or delete saved student portfolios and class batches." },
      { property: "og:title", content: "Saved Portfolios" },
      { property: "og:description", content: "Manage saved student portfolios." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { portfolios, batches } = useStore();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [date, setDate] = useState("");
  const classes = useMemo(() => [...new Set(portfolios.map((p) => p.className).filter(Boolean))].sort(), [portfolios]);
  const list = portfolios.filter(
    (p) =>
      p.studentName.toLowerCase().includes(q.toLowerCase()) &&
      (!cls || p.className === cls) &&
      (!date || p.date.includes(date)),
  );
  return (
    <AppShell>
      <PageTitle title="Saved portfolios" sub="Everything is saved on this device's browser." />
      <div className="panel mb-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Input placeholder="Search student name…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c}>{c}</option>)}
          </select>
          <Input placeholder="Filter by date…" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <h3 className="form-heading mb-2">Individual portfolios ({list.length})</h3>
        {list.length === 0 ? <p className="text-sm text-muted-foreground">Nothing found.</p> : (
          <table className="data-table">
            <thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Date</th><th /></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-foreground">{displayName(p)}</td>
                  <td>{p.className}{p.section && ` - ${p.section}`}</td>
                  <td>{p.subject}</td>
                  <td>{p.date}</td>
                  <td className="text-right">
                    <Button asChild size="sm" variant="outline"><Link to="/create" search={{ id: p.id }}>Open</Link></Button>{" "}
                    <Button size="sm" variant="ghost" onClick={() => confirm(`Delete ${displayName(p)}'s portfolio?`) && deletePortfolio(p.id)}><Trash2 /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="panel">
        <h3 className="form-heading mb-2">Class batches ({batches.length})</h3>
        {batches.length === 0 ? <p className="text-sm text-muted-foreground">No batches saved.</p> : (
          <table className="data-table">
            <thead><tr><th>Batch</th><th>Students</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium text-foreground">{b.name}</td>
                  <td>{b.students.length}</td>
                  <td>{new Date(b.updatedAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <Button asChild size="sm" variant="outline"><Link to="/bulk" search={{ id: b.id }}>Open</Link></Button>{" "}
                    <Button size="sm" variant="ghost" onClick={() => confirm(`Delete batch "${b.name}"?`) && deleteBatch(b.id)}><Trash2 /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
