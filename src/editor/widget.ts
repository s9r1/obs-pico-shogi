import { WidgetType, type EditorView } from "@codemirror/view";
import { createBoardElement, parseSource } from "../parse";

export class ShogiBoardWidget extends WidgetType {
  constructor(readonly source: string) {
    super();
  }

  eq(other: WidgetType): boolean {
    return other instanceof ShogiBoardWidget && other.source === this.source;
  }

  toDOM(view: EditorView): HTMLElement {
    const doc = view.dom.ownerDocument ?? document;
    const root = doc.createElement("div");
    root.className = "pico-shogi-widget cm-embed-block";

    const result = parseSource(this.source);
    if (!result.ok) {
      const errorEl = doc.createElement("div");
      errorEl.className = "pico-shogi-error";
      errorEl.textContent = result.error;
      root.appendChild(errorEl);
      return root;
    }

    const board = createBoardElement(doc, result.attrs);
    root.appendChild(board);
    return root;
  }

  updateDOM(): boolean {
    // source が変わったら toDOM で作り直す(true を返すと古い盤面が使い回される)。
    return false;
  }

  // 既定セル 30px の 9x9 盤 + 駒台 + スライダーのおおよその高さ。
  get estimatedHeight(): number {
    return 350;
  }

  ignoreEvent(): boolean {
    return true;
  }
}
