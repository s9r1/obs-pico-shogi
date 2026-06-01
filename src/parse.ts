import { parseYaml } from "obsidian";

export type BoardAttrs = {
  kif: string;
  teban?: string;
  nanteme?: string;
  noSlider?: boolean;
};

export type ParseResult =
  | { ok: true; attrs: BoardAttrs }
  | { ok: false; error: string };

export function parseSource(source: string): ParseResult {
  const trimmed = source.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "コードブロックが空です。`kif:` を指定してください。" };
  }

  let raw: unknown;
  try {
    raw = parseYaml(source);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `YAML として解釈できませんでした: ${msg}` };
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "YAML はキー: 値 形式で指定してください。" };
  }

  const obj = raw as Record<string, unknown>;
  const kifRaw = obj["kif"];
  if (typeof kifRaw !== "string" || kifRaw.trim().length === 0) {
    return { ok: false, error: "`kif` キーは必須で、文字列で指定してください。" };
  }

  const attrs: BoardAttrs = { kif: kifRaw };

  const teban = obj["teban"];
  if (typeof teban === "string" && teban.length > 0) {
    attrs.teban = teban;
  }

  const nanteme = obj["nanteme"];
  if (typeof nanteme === "number" && Number.isFinite(nanteme)) {
    attrs.nanteme = String(nanteme);
  } else if (typeof nanteme === "string" && nanteme.length > 0) {
    attrs.nanteme = nanteme;
  }

  const noSliderKeyPresent = "no-slider" in obj || "noSlider" in obj;
  const noSliderValue = obj["no-slider"] ?? obj["noSlider"];
  if (noSliderKeyPresent && isTruthyOrPresent(noSliderValue)) {
    attrs.noSlider = true;
  }

  return { ok: true, attrs };
}

function isTruthyOrPresent(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (v === true) return true;
  if (typeof v === "string") {
    const lower = v.trim().toLowerCase();
    if (lower === "false" || lower === "no" || lower === "0") return false;
    return true;
  }
  if (typeof v === "number") return v !== 0;
  return false;
}

export function createBoardElement(doc: Document, attrs: BoardAttrs): HTMLElement {
  const el = doc.createElement("shogi-board");
  el.setAttribute("kif", attrs.kif);
  if (attrs.teban !== undefined) el.setAttribute("teban", attrs.teban);
  if (attrs.nanteme !== undefined) el.setAttribute("nanteme", attrs.nanteme);
  if (attrs.noSlider) el.setAttribute("no-slider", "");
  return el;
}
