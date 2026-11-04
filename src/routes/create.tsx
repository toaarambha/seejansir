import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PortfolioForm } from "@/components/PortfolioForm";
import { A4Preview } from "@/components/A4Preview";
import { ExportPanel } from "@/components/ExportPanel";
import { Button } from "@/components/ui/button";
import { emptyPortfolio, headerSrc, loadPortfolios, savePortfolio, useStore, validatePortfolio, type Portfolio } from "@/lib/portfolio";

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}),
  head: () => ({
    meta: [
      { title: "Create Portfolio — Aarambha Academy" },
      { name: "description", content: "Upload beginning, process and completion photos and preview the A4 portfolio live." },
      { property: "og:title", content: "Create Student Portfolio" },
      { property: "og:description", content: "Build a single-student A4 activity portfolio." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { id } = Route.useSearch();
  const nav = useNavigate();
  const { settings } = useStore();
  const [p, setP] = useState<Portfolio>(() => emptyPortfolio());

  useEffect(() => {
    if (!id) { setP(emptyPortfolio()); return; }
    loadPortfolios().then((all) => {
      const found = all.find((x) => x.id === id);
      if (found) setP(found);
    });
  }, [id]);

  const save = async () => {
    if (!p.studentName.trim() || !p.className.trim()) { toast.error("Student name and class are required"); return; }
    await savePortfolio(p);
    toast.success("Portfolio saved");
    if (id !== p.id) nav({ to: "/create", search: { id: p.id }, replace: true });
  };
  const errs = validatePortfolio(p);

  return (
    <AppShell>
      <PageTitle title={id ? "Edit portfolio" : "Create new portfolio"} sub="Fill in the details — the A4 page updates as you type.">
        <Button variant="outline" onClick={() => nav({ to: "/create", search: {} })}><Plus />New</Button>
        <Button onClick={save}><Save />Save</Button>
      </PageTitle>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="panel"><PortfolioForm p={p} onChange={setP} /></div>
          {errs.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Before exporting: {errs.join(" · ")}
            </div>
          )}
          <ExportPanel list={[p]} current={p} header={headerSrc(settings)} />
        </div>
        <div className="xl:sticky xl:top-6 xl:self-start"><A4Preview p={p} header={headerSrc(settings)} /></div>
      </div>
    </AppShell>
  );
}
