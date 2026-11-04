import { LAYOUT, PHOTO_KEYS, type Portfolio } from "@/lib/portfolio";

const mm = (n: number) => `${n}mm`;

/** Printable A4 page drawn in millimetres. Mirrors the PDF layout exactly. */
export function PortfolioPage({ p, header }: { p: Portfolio; header: string }) {
  const L = LAYOUT;
  const cls = [p.className, p.section].filter(Boolean).join(" - ");
  return (
    <div className="a4-page">
      <img
        src={header}
        alt="Aarambha Academy header"
        style={{ position: "absolute", left: mm(L.header.x), top: mm(L.header.y), width: mm(L.header.w), height: mm(L.header.h) }}
      />
      <div className="a4-field a4-small" style={{ left: mm(14), top: mm(L.nameLineY - 4), width: mm(106) }}>
        <span>Name:</span>
        <span className="a4-line">{p.studentName}</span>
      </div>
      <div className="a4-field a4-small" style={{ left: mm(130), top: mm(L.nameLineY - 4), width: mm(66) }}>
        <span>Class:</span>
        <span className="a4-line">{cls}</span>
      </div>

      {L.photos.map((box, i) => {
        const key = PHOTO_KEYS[i]!;
        const src = p.photos[key];
        return (
          <div
            key={i}
            className="a4-photo"
            style={{ left: mm(box.x), top: mm(box.y), width: mm(box.w), height: mm(box.h) }}
          >
            {src ? <img src={src} alt={key} /> : <span className="a4-photo-empty">{key}</span>}
          </div>
        );
      })}

      {[
        ["Time:", p.time, 30],
        ["Date:", p.date, 30],
        ["Subject:", p.subject, 50],
      ].map(([label, val, len], i) => (
        <div key={i} className="a4-field a4-big" style={{ left: mm(L.fields.x), top: mm(L.fields.y[i]! - 5.2) }}>
          <b>{label}</b>
          <span className="a4-line" style={{ width: mm(len as number) }}>{val}</span>
        </div>
      ))}

      <div
        className="a4-box"
        style={{ left: mm(L.box.x), top: mm(L.box.y), width: mm(L.box.w), height: mm(L.box.h), borderRadius: mm(L.box.r) }}
      >
        {p.reflection}
      </div>
    </div>
  );
}
