import { jsPDF } from "jspdf";
import JSZipLike from "jszip";
import { LAYOUT, PHOTO_KEYS, type Portfolio } from "./portfolio";

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const res = await fetch(src);
  if (!res.ok) throw new Error("Could not load the school header image");
  const blob = await res.blob();
  return await new Promise((r, j) => {
    const fr = new FileReader();
    fr.onload = () => r(fr.result as string);
    fr.onerror = j;
    fr.readAsDataURL(blob);
  });
}

async function imgSize(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return { w: img.naturalWidth, h: img.naturalHeight };
}

function fmt(src: string) {
  return src.startsWith("data:image/png") ? "PNG" : "JPEG";
}

function line(doc: jsPDF, label: string, value: string, x: number, y: number, len: number) {
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(label, x, y);
  const lx = x + doc.getTextWidth(label) + 2;
  doc.setLineWidth(0.3);
  doc.line(lx, y + 1, lx + len, y + 1);
  doc.setFont("times", "normal");
  if (value) doc.text(value, lx + 1.5, y - 0.3, { maxWidth: len - 2 });
}

async function drawPage(doc: jsPDF, p: Portfolio, header: string) {
  const L = LAYOUT;
  doc.addImage(header, fmt(header), L.header.x, L.header.y, L.header.w, L.header.h);

  // Name / Class
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setDrawColor(0);
  doc.text("Name:", 14, L.nameLineY);
  doc.line(27, L.nameLineY + 0.8, 120, L.nameLineY + 0.8);
  doc.text("Class:", 130, L.nameLineY);
  doc.line(142, L.nameLineY + 0.8, 196, L.nameLineY + 0.8);
  doc.setFontSize(11);
  if (p.studentName) doc.text(p.studentName, 29, L.nameLineY - 0.4, { maxWidth: 90 });
  const cls = [p.className, p.section].filter(Boolean).join(" - ");
  if (cls) doc.text(cls, 144, L.nameLineY - 0.4, { maxWidth: 51 });

  // Photos — contain-fit within each box, thin border around the photo
  for (let i = 0; i < 3; i++) {
    const box = L.photos[i]!;
    const src = p.photos[PHOTO_KEYS[i]!];
    if (!src) continue;
    const s = await imgSize(src);
    const scale = Math.min(box.w / s.w, box.h / s.h);
    const w = s.w * scale;
    const h = s.h * scale;
    const x = box.x + (box.w - w) / 2;
    const y = box.y + (box.h - h) / 2;
    doc.addImage(src, fmt(src), x, y, w, h, undefined, "FAST");
    doc.setDrawColor(190);
    doc.setLineWidth(0.25);
    doc.rect(x, y, w, h);
  }

  doc.setDrawColor(0);
  line(doc, "Time:", p.time, L.fields.x, L.fields.y[0], 30);
  line(doc, "Date:", p.date, L.fields.x, L.fields.y[1], 30);
  line(doc, "Subject:", p.subject, L.fields.x, L.fields.y[2], 50);

  const b = L.box;
  doc.setDrawColor(70, 90, 160);
  doc.setLineWidth(0.4);
  doc.roundedRect(b.x, b.y, b.w, b.h, b.r, b.r);
  if (p.reflection.trim()) {
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(p.reflection, b.w - 14);
    doc.text(lines.slice(0, 18), b.x + 7, b.y + 10, { lineHeightFactor: 1.35 });
  }
}

export async function buildPdf(list: Portfolio[], headerSrc: string): Promise<Blob> {
  const header = await toDataUrl(headerSrc);
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  for (let i = 0; i < list.length; i++) {
    if (i > 0) doc.addPage("a4", "portrait");
    await drawPage(doc, list[i]!, header);
  }
  return doc.output("blob");
}

export function fileNameFor(p: Portfolio) {
  const base = [p.studentName || "student", p.className, p.roll].filter(Boolean).join("_");
  return base.replace(/[^\w\-]+/g, "_") + ".pdf";
}

export async function buildIndividualZip(list: Portfolio[], headerSrc: string) {
  const zip = new JSZipLike();
  const used = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    let name = `${String(i + 1).padStart(2, "0")}-${fileNameFor(list[i]!)}`;
    while (used.has(name)) name = "x" + name;
    used.add(name);
    zip.file(name, await buildPdf([list[i]!], headerSrc));
  }
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
