## 概要

Obsidian プラグイン。`shogi-board` / `shogi` コードブロックを `<shogi-board>` Web Component に置き換える。盤本体は submodule `pico-shogi/` を **TypeScript ソース直 import** で取り込み esbuild でバンドル（dist は使わない）。

## コマンド

- `pnpm dev` — esbuild watch（`main.js` 生成）
- `pnpm build` — 型チェック + 本番バンドル
- `pnpm check` — 型チェックのみ

テストはこのリポジトリには無い（submodule 側に vitest あり）。

## アーキテクチャ

Reading mode と Live Preview の **二系統** で同じコードブロックを描く:

- Reading mode: `src/code-block.ts` が post processor として動作。
- Live Preview: `src/editor/state-field.ts` の CodeMirror StateField が `scanShogiBlocks` でフェンスを検出し、カーソルがブロック外にあるときだけ `ShogiBoardWidget` で replace decoration を出す。

両経路とも `src/parse.ts` の `parseSource` / `createBoardElement` を共有。属性パースの変更はここ 1 箇所。コードブロック本体は Obsidian の `parseYaml` で解釈する。

設定タブ (`src/settings.ts`) は `<style id="obs-pico-shogi-user-style">` を `document.head` に挿し、`shogi-board { --ps-*: ...; }` で pico-shogi の CSS 変数を上書きする方式。`sanitizeCssValue` が `< > { } ;` 等を弾く。

## 非自明な注意点

- `esbuild.config.mjs` の `alias.tsshogi` は **root の `node_modules/tsshogi` に固定**。submodule 側との二重バンドル防止。tsshogi 関連で `instanceof` が通らない等の症状が出たらここを疑う。
- `<shogi-board>` は CustomElementRegistry 仕様上アンレジスター不可。プラグインリロード後に新しい `main.js` を完全反映させるには Obsidian 自体の再起動が必要。
- 受理するフェンス名は `shogi-board` と `shogi` の 2 つ。追加するなら `src/main.ts` の processor 登録と `src/editor/block-scan.ts` の `ACCEPTED_FENCES` 両方を更新。
- `no-slider` の真偽判定 (`src/parse.ts` の `isTruthyOrPresent`) は独特: **値なし / `null` / `undefined` も truthy 扱い**、`false` / `no` / `0` のみ falsy。
- **popout ウィンドウ非対応**: `defineShogiBoard()` はメインウィンドウの `customElements` にしか登録しないため、popout では `<shogi-board>` がアップグレードされず盤自体が描画されない。設定タブの CSS 変数上書き（`document.head` への style 挿入）も同様に反映されない。対応するなら `workspace.on("window-open")` で要素登録 + style 複製が必要（別 window realm への custom element 登録が Electron で通るかは要実機検証）。
- `main.js` は esbuild の生成物。手編集しない。

詳細は `pico-shogi/CLAUDE.md` も参照。
