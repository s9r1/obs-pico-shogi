import { RangeSetBuilder, StateField, type EditorState } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { scanShogiBlocks, type ShogiBlock } from "./block-scan";
import { ShogiBoardWidget } from "./widget";

type FieldValue = {
  blocks: ShogiBlock[];
  decorations: DecorationSet;
};

const EMPTY: FieldValue = { blocks: [], decorations: Decoration.none };

// editorLivePreviewField が無い環境(通常あり得ない)では Live Preview 扱いにする。
function isLivePreview(state: EditorState): boolean {
  return state.field(editorLivePreviewField, false) !== false;
}

function buildDecorations(state: EditorState, blocks: ShogiBlock[]): DecorationSet {
  if (blocks.length === 0) return Decoration.none;
  const ranges = state.selection.ranges;
  const builder = new RangeSetBuilder<Decoration>();
  for (const b of blocks) {
    const cursorInside = ranges.some((r) => r.to >= b.from && r.from <= b.to);
    if (cursorInside) continue;
    builder.add(
      b.from,
      b.to,
      Decoration.replace({
        widget: new ShogiBoardWidget(b.source),
        block: true,
        inclusive: false,
      }),
    );
  }
  return builder.finish();
}

function compute(state: EditorState): FieldValue {
  if (!isLivePreview(state)) return EMPTY;
  const blocks = scanShogiBlocks(state);
  return { blocks, decorations: buildDecorations(state, blocks) };
}

export const shogiBoardField = StateField.define<FieldValue>({
  create: (state) => compute(state),
  update(value, tr) {
    const livePreview = isLivePreview(tr.state);
    const modeChanged = livePreview !== isLivePreview(tr.startState);
    if (tr.docChanged || modeChanged) return compute(tr.state);
    if (!livePreview || !tr.selection) return value;
    // selection のみの変更ではスキャンし直さず、キャッシュ済みブロックを再フィルタする。
    return { blocks: value.blocks, decorations: buildDecorations(tr.state, value.blocks) };
  },
  provide: (f) => EditorView.decorations.from(f, (v) => v.decorations),
});
