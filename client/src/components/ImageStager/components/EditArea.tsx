import { useEffect, useRef, useState } from "react";
export function EditArea({
  image,
  onChange,
  disabled,
  initialMask,
}: {
  image: string;
  onChange: (mask: string) => void;
  disabled: boolean;
  initialMask?: string | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const mask = useRef<HTMLCanvasElement | null>(null);
  const [brush, setBrush] = useState(8);
  const [protect, setProtect] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [undoCount, setUndoCount] = useState(0);
  const history = useRef<string[]>([]);
  const remember = () => {
    if (!mask.current || disabled) return;
    history.current = [...history.current.slice(-7), mask.current.toDataURL("image/png")];
    setUndoCount(history.current.length);
  };
  const undo = () => {
    const previous = history.current.pop();
    if (!previous || disabled) return;
    const img = new Image();
    img.onload = () => {
      const m = mask.current!;
      const ctx = m.getContext("2d")!;
      ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0,0,m.width,m.height); ctx.drawImage(img,0,0);
      publish(); setUndoCount(history.current.length);
    };
    img.src = previous;
  };
  const drawing = useRef(false);
  const changed = useRef(onChange);
  changed.current = onChange;
  const publish = () => {
    const m = mask.current,
      c = canvas.current;
    if (!m || !c) return;
    const data = m.getContext("2d")!.getImageData(0, 0, m.width, m.height);
    const ctx = c.getContext("2d")!;
    c.width = m.width;
    c.height = m.height;
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = 245;
      data.data[i + 1] = 158;
      data.data[i + 2] = 11;
      data.data[i + 3] = Math.round((255 - data.data[i + 3]) * 0.42);
    }
    ctx.putImageData(data, 0, 0);
    changed.current(m.toDataURL("image/png").split(",")[1]);
  };
  const reset = (empty = false) => {
    const m = mask.current;
    if (!m) return;
    const ctx = m.getContext("2d")!;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, m.width, m.height);
    if (!empty)
      ctx.clearRect(
        m.width * 0.18,
        m.height * 0.4,
        m.width * 0.64,
        m.height * 0.6,
      );
    publish();
  };
  useEffect(() => {
    history.current = []; setUndoCount(0); setZoom(100);
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      const m = document.createElement("canvas");
      m.width = img.naturalWidth;
      m.height = img.naturalHeight;
      mask.current = m;
      if (initialMask) {
        const saved = new Image();
        saved.onload = () => { if (active) { m.getContext("2d")!.drawImage(saved, 0, 0); publish(); } };
        saved.onerror = () => { if (active) reset(); };
        saved.src = `data:image/png;base64,${initialMask}`;
      } else reset();
    };
    img.src = image;
    return () => {
      active = false;
    };
  }, [image, initialMask]);
  const paint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !drawing.current || !mask.current) return;
    const m = mask.current,
      r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) * m.width) / r.width,
      y = ((e.clientY - r.top) * m.height) / r.height;
    const ctx = m.getContext("2d")!;
    ctx.globalCompositeOperation = protect ? "source-over" : "destination-out";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x, y, (m.width * brush) / 200, 0, Math.PI * 2);
    ctx.fill();
    const overlay = canvas.current!.getContext("2d")!;
    overlay.globalCompositeOperation = protect
      ? "destination-out"
      : "source-over";
    overlay.fillStyle = "rgba(245,158,11,.42)";
    overlay.beginPath();
    overlay.arc(x, y, (m.width * brush) / 200, 0, Math.PI * 2);
    overlay.fill();
  };
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h4 className="font-semibold">Choose where furniture can change</h4>
      <p className="text-sm text-slate-600">
        Orange areas can be edited. Paint over furniture to replace or remove
        it. Use Protect to keep doors, windows, built-ins and other details
        unchanged.
      </p>
      <div className="mx-auto max-w-2xl overflow-auto rounded border" style={{ maxHeight: "65vh" }}>
      <div className="relative" style={{ width: `${zoom}%` }}>
        <img
          src={image}
          alt="Room with highlighted editable area"
          className="block w-full rounded"
        />
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full touch-none"
          aria-label="Paint editable areas on the room"
          onPointerDown={(e) => {
            if (disabled) return;
            remember();
            drawing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            paint(e);
          }}
          onPointerMove={paint}
          onPointerUp={() => {
            drawing.current = false;
            publish();
          }}
          onPointerCancel={() => {
            drawing.current = false;
            publish();
          }}
        />
      </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" disabled={disabled || !undoCount} onClick={undo} className="rounded border px-3 py-2 disabled:opacity-40">Undo selection</button>
        <label>Zoom <select aria-label="Photo zoom" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="rounded border p-2"><option value={100}>100%</option><option value={150}>150%</option><option value={200}>200%</option></select></label>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={!protect}
          onClick={() => setProtect(false)}
          className="rounded border px-3 py-2"
        >
          Paint edit area
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={protect}
          onClick={() => setProtect(true)}
          className="rounded border px-3 py-2"
        >
          Protect
        </button>
        <label>
          Brush size{" "}
          <input
            aria-label="Brush size"
            type="range"
            min="2"
            max="25"
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          disabled={disabled}
            onClick={() => { remember(); reset(); }}
          className="rounded border px-3 py-2"
        >
          Use center area
        </button>
        <button
          type="button"
          disabled={disabled}
            onClick={() => { remember(); reset(true); }}
          className="rounded border px-3 py-2"
        >
          Protect everything
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Include the entire furniture item and its shadow in your selection. For bedrooms, allow room for the full bed and bedding; use Protect to trace the window and trim instead of leaving a large protected rectangle through the furniture area. The original pixels outside your selection are preserved. Review AI
        changes inside the selection before using the result.
      </p>
    </section>
  );
}
