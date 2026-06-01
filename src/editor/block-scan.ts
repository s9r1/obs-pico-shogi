import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";

export type ShogiBlock = {
  from: number;
  to: number;
  source: string;
};

const FENCE_RE = /^( {0,3})(`{3,}|~{3,})[ \t]*([\w-]+)?[ \t]*$/;
const ACCEPTED_FENCES = new Set(["shogi-board", "shogi"]);

export function scanShogiBlocks(state: EditorState): ShogiBlock[] {
  const blocks = scanViaSyntaxTree(state);
  if (blocks.length > 0) return blocks;
  return scanViaLineWalk(state);
}

function scanViaSyntaxTree(state: EditorState): ShogiBlock[] {
  const blocks: ShogiBlock[] = [];
  const tree = syntaxTree(state);
  let pendingBegin: number | null = null;

  tree.iterate({
    enter(node) {
      const name = node.type.name;
      if (name.startsWith("HyperMD-codeblock-begin")) {
        if (pendingBegin !== null) return;
        const beginLine = state.doc.lineAt(node.from);
        if (!matchesShogiFence(beginLine.text)) return;
        pendingBegin = beginLine.number;
      } else if (name.startsWith("HyperMD-codeblock-end")) {
        if (pendingBegin === null) return;
        const beginLine = state.doc.line(pendingBegin);
        const endLine = state.doc.lineAt(node.from);
        const source = collectSource(state, beginLine.number, endLine.number);
        blocks.push({ from: beginLine.from, to: endLine.to, source });
        pendingBegin = null;
      }
    },
  });

  return blocks;
}

function scanViaLineWalk(state: EditorState): ShogiBlock[] {
  const blocks: ShogiBlock[] = [];
  const totalLines = state.doc.lines;
  let i = 1;

  while (i <= totalLines) {
    const line = state.doc.line(i);
    const open = parseFence(line.text);
    if (!open || open.lang === undefined || !ACCEPTED_FENCES.has(open.lang)) {
      i++;
      continue;
    }

    let endLineNo: number | null = null;
    for (let j = i + 1; j <= totalLines; j++) {
      const inner = state.doc.line(j).text;
      const close = parseFence(inner);
      if (close && close.lang === undefined && close.markerChar === open.markerChar && close.markerLen >= open.markerLen) {
        endLineNo = j;
        break;
      }
    }

    if (endLineNo === null) {
      i++;
      continue;
    }

    const beginLine = state.doc.line(i);
    const endLine = state.doc.line(endLineNo);
    const source = collectSource(state, i, endLineNo);
    blocks.push({ from: beginLine.from, to: endLine.to, source });
    i = endLineNo + 1;
  }

  return blocks;
}

function matchesShogiFence(text: string): boolean {
  const parsed = parseFence(text);
  if (!parsed || parsed.lang === undefined) return false;
  return ACCEPTED_FENCES.has(parsed.lang);
}

type FenceInfo = {
  markerChar: "`" | "~";
  markerLen: number;
  lang: string | undefined;
};

function parseFence(text: string): FenceInfo | null {
  const m = FENCE_RE.exec(text);
  if (!m) return null;
  const marker = m[2];
  const markerChar = marker[0] as "`" | "~";
  const markerLen = marker.length;
  const langRaw = m[3];
  const lang = langRaw ? langRaw.toLowerCase() : undefined;
  return { markerChar, markerLen, lang };
}

function collectSource(state: EditorState, beginLineNo: number, endLineNo: number): string {
  if (endLineNo - beginLineNo <= 1) return "";
  const parts: string[] = [];
  for (let n = beginLineNo + 1; n < endLineNo; n++) {
    parts.push(state.doc.line(n).text);
  }
  return parts.join("\n");
}
