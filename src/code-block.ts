import type { MarkdownPostProcessorContext } from "obsidian";
import { createBoardElement, parseSource } from "./parse";

export function renderCodeBlock(
  source: string,
  el: HTMLElement,
  _ctx: MarkdownPostProcessorContext,
): void {
  const result = parseSource(source);
  if (!result.ok) {
    const errorEl = el.createDiv({ cls: "pico-shogi-error" });
    errorEl.setText(result.error);
    return;
  }

  const wrapper = el.createDiv({ cls: "pico-shogi-block" });
  const board = createBoardElement(el.ownerDocument ?? document, result.attrs);
  wrapper.appendChild(board);
}
