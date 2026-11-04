import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { fileToDataUrl, PHOTO_KEYS, type PhotoKey, type Portfolio } from "@/lib/portfolio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const PHOTO_INFO: Record<PhotoKey, { title: string; text: string }> = {
  beginning: { title: "1 · Beginning", text: "Upload the photograph showing the beginning of the activity." },
  process: { title: "2 · Process", text: "Upload the photograph showing the student performing the activity." },
  completion: { title: "3 · Completion", text: "Upload the photograph showing the completed activity." },
};

function PhotoCard({ k, src, onChange }: { k: PhotoKey; src?: string | undefined; onChange: (v?: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const handle = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await fileToDataUrl(f));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className={`upload-card ${drag ? "upload-card-drag" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
    >
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{PHOTO_INFO[k].title}</span>
        <span className="text-xs text-muted-foreground">
          {busy ? "Uploading…" : src ? <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" />Uploaded</span> : "Required"}
        </span>
      </div>
      {src ? (
        <img src={src} alt={k} className="h-32 w-full rounded-md bg-muted object-contain" />
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="upload-drop">
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs">{PHOTO_INFO[k].text}</span>
          <span className="text-xs font-medium text-primary">Drag & drop or browse</span>
        </button>
      )}
      {src && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => input.current?.click()}><RefreshCw />Replace</Button>
          <Button size="icon" variant="ghost" aria-label="Remove image" onClick={() => onChange(undefined)}><Trash2 /></Button>
        </div>
      )}
    </div>
  );
}

export function PortfolioForm({ p, onChange, hideActivity }: { p: Portfolio; onChange: (p: Portfolio) => void; hideActivity?: boolean }) {
  const set = (k: keyof Portfolio) => (e: { target: { value: string } }) => onChange({ ...p, [k]: e.target.value });
  const F = (k: keyof Portfolio, label: string, opts: { req?: boolean; type?: string; ph?: string } = {}) => (
    <div className="space-y-1.5">
      <Label>{label}{opts.req && <span className="text-destructive"> *</span>}</Label>
      <Input type={opts.type} placeholder={opts.ph} value={p[k] as string} onChange={set(k)} />
    </div>
  );
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="form-heading">Student details</h3>
        <div className="grid grid-cols-2 gap-3">
          {F("studentName", "Student name", { req: true })}
          {F("className", "Class", { req: true })}
          {F("section", "Section")}
          {F("roll", "Roll number")}
        </div>
      </section>
      {!hideActivity && (
        <section className="space-y-3">
          <h3 className="form-heading">Activity details</h3>
          <div className="grid grid-cols-2 gap-3">
            {F("subject", "Subject")}
            {F("activityTitle", "Activity title")}
            {F("time", "Time", { ph: "e.g. 10:30 AM" })}
            {F("date", "Date", { ph: "e.g. 2083/07/16" })}
          </div>
        </section>
      )}
      <section className="space-y-3">
        <h3 className="form-heading">Photographs</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {PHOTO_KEYS.map((k) => (
            <PhotoCard key={k} k={k} src={p.photos[k]} onChange={(v) => onChange({ ...p, photos: { ...p.photos, [k]: v } })} />
          ))}
        </div>
      </section>
      <section className="space-y-1.5">
        <Label>Reflection / remarks (optional)</Label>
        <Textarea rows={4} placeholder="Leave blank to keep the box empty for handwriting" value={p.reflection} onChange={set("reflection")} />
      </section>
    </div>
  );
}
