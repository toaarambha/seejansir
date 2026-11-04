import { get, set } from "idb-keyval";
import { useEffect, useState } from "react";
import headerAsset from "@/assets/aarambha-header.png.asset.json";

export type PhotoKey = "beginning" | "process" | "completion";
export const PHOTO_KEYS: PhotoKey[] = ["beginning", "process", "completion"];

export interface Portfolio {
  id: string;
  studentName: string;
  className: string;
  section: string;
  roll: string;
  subject: string;
  activityTitle: string;
  time: string;
  date: string;
  reflection: string;
  photos: Partial<Record<PhotoKey, string>>; // data URLs
  createdAt: number;
  updatedAt: number;
}

export interface Batch {
  id: string;
  name: string;
  students: Portfolio[];
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  headerImage: string | null; // custom data URL; null = default school header
  schoolName: string;
  contact: string;
  address: string;
  website: string;
}

export const DEFAULT_HEADER_URL = headerAsset.url;
export const HEADER_ASPECT = 201 / 1090;

/** Printable layout in millimetres — single source of truth for preview and PDF. */
export const LAYOUT = {
  pageW: 210,
  pageH: 297,
  margin: 10,
  header: { x: 10, y: 8, w: 190, h: 190 * HEADER_ASPECT },
  nameLineY: 53,
  photos: [
    { x: 10, y: 66, w: 56, h: 75 },
    { x: 77, y: 81, w: 56, h: 75 },
    { x: 144, y: 96, w: 56, h: 75 },
  ],
  fields: { x: 14, y: [192, 203, 214] },
  box: { x: 14, y: 224, w: 182, h: 62, r: 9 },
} as const;

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function emptyPortfolio(partial: Partial<Portfolio> = {}): Portfolio {
  const now = Date.now();
  return {
    id: uid(),
    studentName: "",
    className: "",
    section: "",
    roll: "",
    subject: "",
    activityTitle: "",
    time: "",
    date: "",
    reflection: "",
    photos: {},
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function missingPhotos(p: Portfolio): PhotoKey[] {
  return PHOTO_KEYS.filter((k) => !p.photos[k]);
}

export function validatePortfolio(p: Portfolio): string[] {
  const errs: string[] = [];
  if (!p.studentName.trim()) errs.push("Student name is required");
  if (!p.className.trim()) errs.push("Class is required");
  const m = missingPhotos(p);
  if (m.length) errs.push(`Missing photo: ${m.join(", ")}`);
  return errs;
}

// ---------- persistence (browser IndexedDB) ----------
const KEYS = { portfolios: "aa-portfolios", batches: "aa-batches", settings: "aa-settings" };
const DEFAULT_SETTINGS: Settings = {
  headerImage: null,
  schoolName: "Aarambha Academy",
  contact: "01-4954886 | 9851220142",
  address: "Tokha-10, Gongabu, Kathmandu",
  website: "www.aarambhaacademy.edu.np",
};

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export async function loadPortfolios(): Promise<Portfolio[]> {
  return (await get<Portfolio[]>(KEYS.portfolios)) ?? [];
}
export async function savePortfolio(p: Portfolio) {
  const all = await loadPortfolios();
  const next = { ...p, updatedAt: Date.now() };
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) all[i] = next;
  else all.unshift(next);
  await set(KEYS.portfolios, all);
  emit();
}
export async function deletePortfolio(id: string) {
  await set(KEYS.portfolios, (await loadPortfolios()).filter((p) => p.id !== id));
  emit();
}
export async function loadBatches(): Promise<Batch[]> {
  return (await get<Batch[]>(KEYS.batches)) ?? [];
}
export async function saveBatch(b: Batch) {
  const all = await loadBatches();
  const next = { ...b, updatedAt: Date.now() };
  const i = all.findIndex((x) => x.id === b.id);
  if (i >= 0) all[i] = next;
  else all.unshift(next);
  await set(KEYS.batches, all);
  emit();
}
export async function deleteBatch(id: string) {
  await set(KEYS.batches, (await loadBatches()).filter((b) => b.id !== id));
  emit();
}
export async function loadSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await get<Settings>(KEYS.settings)) ?? {}) };
}
export async function saveSettings(s: Settings) {
  await set(KEYS.settings, s);
  emit();
}

export function useStore() {
  const [state, setState] = useState<{
    portfolios: Portfolio[];
    batches: Batch[];
    settings: Settings;
    ready: boolean;
  }>({ portfolios: [], batches: [], settings: DEFAULT_SETTINGS, ready: false });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [portfolios, batches, settings] = await Promise.all([
        loadPortfolios(),
        loadBatches(),
        loadSettings(),
      ]);
      if (alive) setState({ portfolios, batches, settings, ready: true });
    };
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, []);
  return state;
}

export function headerSrc(s: Settings) {
  return s.headerImage ?? DEFAULT_HEADER_URL;
}

/** Read + downscale an uploaded photo to a JPEG data URL. */
export async function fileToDataUrl(file: File, max = 1600): Promise<string> {
  if (!/^image\/(jpe?g|png|webp)$/.test(file.type)) {
    throw new Error("Please upload a JPG, PNG or WEBP image");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function displayName(p: Portfolio) {
  return p.studentName.trim() || "Unnamed student";
}
