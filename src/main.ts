import { debounce, Plugin } from "obsidian";
import { defineShogiBoard } from "../pico-shogi/src/index";
import { renderCodeBlock } from "./code-block";
import { shogiBoardField } from "./editor/state-field";
import {
  buildUserStyleCss,
  DEFAULT_SETTINGS,
  PicoShogiSettingTab,
  type PicoShogiSettings,
} from "./settings";

const STYLE_ELEMENT_ID = "obs-pico-shogi-user-style";
const SAVE_DEBOUNCE_MS = 300;

export default class PicoShogiPlugin extends Plugin {
  settings: PicoShogiSettings = { ...DEFAULT_SETTINGS };

  private scheduledSave: (() => void) & { cancel?: () => void } = debounce(
    () => {
      void this.saveData(this.settings);
    },
    SAVE_DEBOUNCE_MS,
    true,
  );

  override async onload(): Promise<void> {
    await this.loadSettings();
    defineShogiBoard();

    this.registerMarkdownCodeBlockProcessor("shogi-board", renderCodeBlock);
    this.registerMarkdownCodeBlockProcessor("shogi", renderCodeBlock);
    this.registerEditorExtension([shogiBoardField]);

    this.addSettingTab(new PicoShogiSettingTab(this.app, this));
    this.applyUserStyle();
  }

  override async onunload(): Promise<void> {
    await this.flushSaveSettings();
    document.getElementById(STYLE_ELEMENT_ID)?.remove();
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<PicoShogiSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(loaded ?? {}) };
  }

  onSettingChange(): void {
    this.applyUserStyle();
    this.scheduledSave();
  }

  async flushSaveSettings(): Promise<void> {
    this.scheduledSave.cancel?.();
    await this.saveData(this.settings);
  }

  applyUserStyle(): void {
    const css = buildUserStyleCss(this.settings);
    let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (css.length === 0) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ELEMENT_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }
}
