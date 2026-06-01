import { RangeSetBuilder, StateField, type EditorState } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { scanShogiBlocks } from "./block-scan";
import { ShogiBoardWidget } from "./widget";

function compute(state: EditorState): DecorationSet {
  const blocks = scanShogiBlocks(state);
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

export const shogiBoardField = StateField.define<DecorationSet>({
  create: (state) => compute(state),
  update(value, tr) {
    if (tr.docChanged || tr.selection) return compute(tr.state);
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});
