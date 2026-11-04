import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { headerSrc, saveSettings, useStore, type Settings } from "@/lib/portfolio";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Aarambha Academy" },
      { name: "description", content: "Configure the school header image and school information for portfolios." },
      { property: "og:title", content: "School Settings" },
      { property: "og:description", content: "Portfolio header and school details." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, ready } = useStore();
  const [s, setS] = useState<Settings>(settings);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ready) setS(settings); }, [ready, settings]);

  const onHeader = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setS({ ...s, headerImage: r.result as string });
    r.readAsDataURL(f);
  };
  const F = (k: keyof Settings, label: string) => (
    <div className="space-y-1.5"><Label>{label}</Label><Input value={(s[k] as string) ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>
  );
  return (
    <AppShell>
      <PageTitle title="School settings">
        <Button onClick={async () => { await saveSettings(s); toast.success("Settings saved"); }}>Save settings</Button>
      </PageTitle>
      <div className="panel mb-6 space-y-3">
        <h3 className="form-heading">Portfolio header image</h3>
        <p className="text-sm text-muted-foreground">Used as one complete image at the top of every portfolio page.</p>
        <div className="rounded-md border bg-card p-3"><img src={headerSrc(s)} alt="School header" className="w-full" /></div>
        <input ref={file} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => onHeader(e.target.files?.[0])} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => file.current?.click()}>Replace header</Button>
          {s.headerImage && <Button variant="ghost" onClick={() => setS({ ...s, headerImage: null })}>Restore Aarambha header</Button>}
        </div>
      </div>
      <div className="panel grid gap-3 sm:grid-cols-2">
        {F("schoolName", "School name")}
        {F("contact", "Contact numbers")}
        {F("address", "Address")}
        {F("website", "Website")}
      </div>
    </AppShell>
  );
}
