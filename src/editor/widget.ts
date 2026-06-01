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

  updateDOM(_dom: HTMLElement): boolean {
    return true;
  }

  ignoreEvent(): boolean {
    return true;
  }
}
