import { useState } from "react";
import { FileDown, Files, FileArchive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildIndividualZip, buildPdf, downloadBlob, fileNameFor } from "@/lib/pdf";
import { validatePortfolio, displayName, type Portfolio } from "@/lib/portfolio";

export function ExportPanel({ list, current, header, label = "class" }: { list: Portfolio[]; current?: Portfolio | undefined; header: string; label?: string }) {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<{ blob: Blob; name: string } | null>(null);

  const check = (items: Portfolio[]) => {
    const bad = items
      .map((p, i) => ({ i, errs: validatePortfolio(p), p }))
      .filter((x) => x.errs.length);
    if (bad.length) {
      toast.error(`${displayName(bad[0]!.p)} (#${bad[0]!.i + 1}): ${bad[0]!.errs.join("; ")}`);
      return false;
    }
    return true;
  };

  const run = async (kind: "current" | "all" | "zip") => {
    const items = kind === "current" && current ? [current] : list;
    if (!items.length) { toast.error("No students to export"); return; }
    if (!check(items)) return;
    setBusy(true);
    setReady(null);
    setStatus(`Generating ${items.length} page${items.length > 1 ? "s" : ""}…`);
    try {
      if (kind === "zip") {
        const blob = await buildIndividualZip(items, header);
        setReady({ blob, name: `portfolios_${label}.zip` });
        setStatus(`${items.length} separate PDFs ready`);
      } else {
        const blob = await buildPdf(items, header);
        const name = kind === "current" ? fileNameFor(items[0]!) : `portfolios_${label}.pdf`;
        setReady({ blob, name });
        setStatus(`${items.length} student${items.length > 1 ? "s" : ""} · ${items.length} A4 page${items.length > 1 ? "s" : ""} ready`);
      }
    } catch (e) {
      setStatus("");
      toast.error("PDF generation failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel space-y-3">
      <h3 className="form-heading">Export PDF</h3>
      <div className="flex flex-wrap gap-2">
        {current && <Button disabled={busy} onClick={() => run("current")}><FileDown />Current student</Button>}
        {list.length > 1 && (
          <>
            <Button disabled={busy} variant="secondary" onClick={() => run("all")}><Files />All students (one PDF)</Button>
            <Button disabled={busy} variant="outline" onClick={() => run("zip")}><FileArchive />Individual PDFs (.zip)</Button>
          </>
        )}
      </div>
      {(status || busy) && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{status}</span>
          {ready && <Button size="sm" onClick={() => downloadBlob(ready.blob, ready.name)}>Download</Button>}
        </div>
      )}
    </div>
  );
}
