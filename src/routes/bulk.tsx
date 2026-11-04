import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, FileSpreadsheet, Plus, Save, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PortfolioForm } from "@/components/PortfolioForm";
import { A4Preview } from "@/components/A4Preview";
import { ExportPanel } from "@/components/ExportPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { displayName, emptyPortfolio, headerSrc, loadBatches, saveBatch, uid, useStore, validatePortfolio, type Batch, type Portfolio } from "@/lib/portfolio";

export const Route = createFileRoute("/bulk")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}),
  head: () => ({
    meta: [
      { title: "Bulk Portfolio Generator — Aarambha Academy" },
      { name: "description", content: "Create one A4 portfolio page per student for a whole class and export together." },
      { property: "og:title", content: "Bulk Student Portfolio Generator" },
      { property: "og:description", content: "Whole-class A4 portfolios in one PDF." },
    ],
  }),
  component: BulkPage,
});

const SHARED = ["subject", "activityTitle", "date", "time"] as const;

function newBatch(): Batch {
  const now = Date.now();
  return { id: uid(), name: "New class batch", students: [emptyPortfolio()], createdAt: now, updatedAt: now };
}

function BulkPage() {
  const { id } = Route.useSearch();
  const { settings } = useStore();
  const [b, setB] = useState<Batch>(newBatch);
  const [sel, setSel] = useState(0);
  const [applyAll, setApplyAll] = useState(false);
  const [shared, setShared] = useState({ subject: "", activityTitle: "", date: "", time: "" });
  const xl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    loadBatches().then((all) => { const f = all.find((x) => x.id === id); if (f) { setB(f); setSel(0); } });
  }, [id]);

  const students = applyAll ? b.students.map((s) => ({ ...s, ...shared })) : b.students;
  const cur = students[sel] ?? students[0];

  const update = (list: Portfolio[]) => setB({ ...b, students: list });
  const setStudent = (p: Portfolio) => update(b.students.map((s, i) => (i === sel ? p : s)));
  const add = () => { update([...b.students, emptyPortfolio({ className: cur?.className ?? "", section: cur?.section ?? "" })]); setSel(b.students.length); };
  const remove = (i: number) => { if (b.students.length === 1) return; update(b.students.filter((_, j) => j !== i)); setSel(Math.max(0, Math.min(sel, b.students.length - 2))); };
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= b.students.length) return;
    const l = [...b.students]; [l[i], l[j]] = [l[j]!, l[i]!]; update(l); setSel(j);
  };
  const duplicateActivity = () => {
    const src = b.students[sel];
    if (!src) return;
    update(b.students.map((s) => ({ ...s, subject: src.subject, activityTitle: src.activityTitle, date: src.date, time: src.time })));
    toast.success("Activity details copied to all students");
  };
  const save = async () => {
    const final = { ...b, students };
    await saveBatch(final);
    setB(final);
    toast.success(`Batch saved (${final.students.length} students)`);
  };
  const importXl = async (f?: File) => {
    if (!f) return;
    try {
      const wb = XLSX.read(await f.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]!]!);
      const pick = (r: Record<string, unknown>, ...keys: string[]) => {
        const k = Object.keys(r).find((x) => keys.includes(x.trim().toLowerCase()));
        return k ? String(r[k] ?? "").trim() : "";
      };
      const list = rows
        .map((r) => emptyPortfolio({
          studentName: pick(r, "student name", "name"),
          className: pick(r, "class"),
          section: pick(r, "section"),
          roll: pick(r, "roll number", "roll no", "roll"),
        }))
        .filter((p) => p.studentName);
      if (!list.length) { toast.error("No rows found. Use columns: Student Name, Class, Section, Roll Number"); return; }
      const existing = b.students.filter((s) => s.studentName || Object.keys(s.photos).length);
      update([...existing, ...list]);
      toast.success(`Imported ${list.length} students — now add their photos`);
    } catch {
      toast.error("Could not read that spreadsheet");
    }
  };

  return (
    <AppShell>
      <PageTitle title="Bulk student portfolio generator" sub="One A4 page per student, in the order shown.">
        <input ref={xl} type="file" hidden accept=".xlsx,.xls,.csv" onChange={(e) => { importXl(e.target.files?.[0]); e.target.value = ""; }} />
        <Button variant="outline" onClick={() => xl.current?.click()}><FileSpreadsheet />Import Excel</Button>
        <Button onClick={save}><Save />Save draft</Button>
      </PageTitle>

      <div className="panel mb-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5"><Label>Batch name</Label><Input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground"><Switch checked={applyAll} onCheckedChange={setApplyAll} />Apply activity details to all students</label>
        </div>
        {applyAll && (
          <div className="grid gap-3 sm:grid-cols-4">
            {SHARED.map((k) => (
              <div key={k} className="space-y-1.5">
                <Label className="capitalize">{k === "activityTitle" ? "Activity title" : k}</Label>
                <Input value={shared[k]} onChange={(e) => setShared({ ...shared, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel space-y-2 self-start">
          <div className="flex items-center justify-between">
            <h3 className="form-heading">Students ({students.length})</h3>
            <Button size="sm" variant="outline" onClick={add}><Plus />Add</Button>
          </div>
          <ol className="max-h-[60vh] space-y-1 overflow-auto">
            {students.map((s, i) => {
              const ok = validatePortfolio(s).length === 0;
              return (
                <li key={s.id} className={`student-row ${i === sel ? "student-row-active" : ""}`} onClick={() => setSel(i)}>
                  <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                  {ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <AlertCircle className="h-4 w-4 shrink-0 text-warning" />}
                  <span className="flex-1 truncate">{displayName(s)}</span>
                  <button aria-label="Move up" onClick={(e) => { e.stopPropagation(); move(i, -1); }}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button aria-label="Move down" onClick={(e) => { e.stopPropagation(); move(i, 1); }}><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button aria-label="Remove" onClick={(e) => { e.stopPropagation(); remove(i); }}><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">Student #{sel + 1}</h3>
              {!applyAll && <Button size="sm" variant="ghost" onClick={duplicateActivity}><Copy />Copy activity to all</Button>}
            </div>
            {b.students[sel] && <PortfolioForm key={b.students[sel].id} p={b.students[sel]} onChange={setStudent} hideActivity={applyAll} />}
          </div>
          <ExportPanel list={students} current={cur} header={headerSrc(settings)} label={b.name.replace(/\W+/g, "_")} />
        </div>
        <div className="xl:sticky xl:top-6 xl:self-start">{cur && <A4Preview p={cur} header={headerSrc(settings)} />}</div>
      </div>
    </AppShell>
  );
}
