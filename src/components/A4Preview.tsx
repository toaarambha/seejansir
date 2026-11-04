import { useEffect, useRef, useState } from "react";
import { PortfolioPage } from "./PortfolioPage";
import type { Portfolio } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";

const PAGE_PX = 793.7; // 210mm at 96dpi
const ZOOMS = [
  { k: "fit", label: "Fit" },
  { k: 0.75, label: "75%" },
  { k: 1, label: "100%" },
  { k: 1.25, label: "125%" },
] as const;

export function A4Preview({ p, header }: { p: Portfolio; header: string }) {
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1.25, (el.clientWidth - 32) / PAGE_PX)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = zoom === "fit" ? fit : zoom;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Live A4 preview</h3>
        <div className="flex gap-1">
          {ZOOMS.map((z) => (
            <Button key={String(z.k)} size="sm" variant={zoom === z.k ? "default" : "outline"} onClick={() => setZoom(z.k)}>
              {z.label}
            </Button>
          ))}
        </div>
      </div>
      <div ref={ref} className="preview-stage">
        <div style={{ width: PAGE_PX * scale, height: PAGE_PX * (297 / 210) * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <PortfolioPage p={p} header={header} />
          </div>
        </div>
      </div>
    </div>
  );
}
