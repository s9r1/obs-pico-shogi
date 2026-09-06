import { parseYaml } from "obsidian";

export type BoardAttrs = {
  kif: string;
  /** 盤を反転して後手視点で表示する。 */
  reverse?: boolean;
  /** 初期表示手数（負値は末尾からの相対）。 */
  start?: string;
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

  // reverse / no-slider は boolean 属性。キーが在れば値なし(null)でも truthy 扱い。
  if (isFlagSet(obj, ["reverse"])) attrs.reverse = true;

  const start = obj["start"];
  if (typeof start === "number" && Number.isFinite(start)) {
    attrs.start = String(start);
  } else if (typeof start === "string" && start.length > 0) {
    attrs.start = start;
  }

  if (isFlagSet(obj, ["no-slider", "noSlider"])) attrs.noSlider = true;

  return { ok: true, attrs };
}

/** いずれかのキーが存在し、その値が truthy（値なしを含む）なら true。 */
function isFlagSet(obj: Record<string, unknown>, keys: string[]): boolean {
  const key = keys.find((k) => k in obj);
  return key !== undefined && isTruthyOrPresent(obj[key]);
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
  if (attrs.reverse) el.setAttribute("reverse", "");
  if (attrs.start !== undefined) el.setAttribute("start", attrs.start);
  if (attrs.noSlider) el.setAttribute("no-slider", "");
  return el;
}
