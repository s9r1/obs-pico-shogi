import { App, PluginSettingTab, Setting } from "obsidian";
import type PicoShogiPlugin from "./main";

export type PicoShogiSettings = {
  cellSize: string;
  lineColor: string;
  boardBg: string;
  textColor: string;
  accentColor: string;
  highlightColor: string;
  promotedColor: string;
};

export const DEFAULT_SETTINGS: PicoShogiSettings = {
  cellSize: "",
  lineColor: "",
  boardBg: "",
  textColor: "",
  accentColor: "",
  highlightColor: "",
  promotedColor: "",
};

type FieldDef = {
  key: keyof PicoShogiSettings;
  cssVar: string;
  label: string;
  description: string;
  placeholder: string;
};

const FIELDS: FieldDef[] = [
  {
    key: "cellSize",
    cssVar: "--ps-cell-size",
    label: "マスサイズ",
    description: "1 マスの一辺。CSS 長さ（例: 30px, 2.2em）。",
    placeholder: "30px",
  },
  {
    key: "lineColor",
    cssVar: "--ps-line",
    label: "罫線・外枠の色",
    description: "盤の格子・外枠の色。",
    placeholder: "#6b5b3e",
  },
  {
    key: "boardBg",
    cssVar: "--ps-board-bg",
    label: "盤の地色",
    description: "9x9 マス領域の背景。`transparent` で下地透過。",
    placeholder: "transparent",
  },
  {
    key: "textColor",
    cssVar: "--ps-text",
    label: "駒・本文の色",
    description: "駒字・手番マーカー・カウンター現在値などの色。",
    placeholder: "#1a1a1a",
  },
  {
    key: "accentColor",
    cssVar: "--ps-accent",
    label: "スライダーのアクセント色",
    description: "再生スライダーのつまみ・進捗バーの色。",
    placeholder: "#8b2a1f",
  },
  {
    key: "highlightColor",
    cssVar: "--ps-highlight",
    label: "最終手ハイライトの色",
    description: "直前に指したマスの背景色。",
    placeholder: "rgba(0, 0, 0, 0.12)",
  },
  {
    key: "promotedColor",
    cssVar: "--ps-promoted",
    label: "成り駒の文字色",
    description: "「と」「龍」など成り駒の文字色。",
    placeholder: "#c0392b",
  },
];

const FORBIDDEN_CSS_PATTERNS = ["/*", "*/", "</"];
const FORBIDDEN_CSS_CHARS = /[<>{};]/;

export function sanitizeCssValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (FORBIDDEN_CSS_CHARS.test(trimmed)) return null;
  for (const p of FORBIDDEN_CSS_PATTERNS) {
    if (trimmed.includes(p)) return null;
  }
  return trimmed;
}

export function buildUserStyleCss(settings: PicoShogiSettings): string {
  const decls: string[] = [];
  for (const f of FIELDS) {
    const v = sanitizeCssValue(settings[f.key]);
    if (v === null) continue;
    decls.push(`  ${f.cssVar}: ${v};`);
  }
  if (decls.length === 0) return "";
  return `shogi-board {\n${decls.join("\n")}\n}\n`;
}

export class PicoShogiSettingTab extends PluginSettingTab {
  private readonly plugin: PicoShogiPlugin;

  constructor(app: App, plugin: PicoShogiPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const desc = containerEl.createEl("p");
    desc.appendText(
      "各項目は pico-shogi が公開する CSS 変数を上書きします。空欄なら pico-shogi のデフォルト値が使われます。色は CSS の任意の指定形式（#hex / rgb() / rgba() / カラー名）で書けます。",
    );

    for (const field of FIELDS) {
      new Setting(containerEl)
        .setName(field.label)
        .setDesc(`${field.description} (CSS 変数: ${field.cssVar}, 既定: ${field.placeholder})`)
        .addText((text) =>
          text
            .setPlaceholder(field.placeholder)
            .setValue(this.plugin.settings[field.key])
            .onChange((value) => {
              this.plugin.settings[field.key] = value;
              this.plugin.onSettingChange();
            }),
        );
    }

    new Setting(containerEl)
      .setName("すべてデフォルトに戻す")
      .setDesc("上記の項目を全て空欄に戻し、pico-shogi 標準の見た目を使います。")
      .addButton((btn) =>
        btn
          .setButtonText("リセット")
          .setWarning()
          .onClick(async () => {
            this.plugin.settings = { ...DEFAULT_SETTINGS };
            this.plugin.applyUserStyle();
            await this.plugin.flushSaveSettings();
            this.display();
          }),
      );
  }
}
