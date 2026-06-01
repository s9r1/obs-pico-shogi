# Pico Shogi Viewer (`obs-pico-shogi`)

Obsidian の Markdown ノート内で、コードブロックから将棋盤・棋譜ビューアを描画するプラグインです。

## インストール

1. [Releases](https://github.com/s9r1/obs-pico-shogi/releases) から最新版の `main.js` / `manifest.json` / `styles.css` をダウンロード。
2. Obsidian の vault 内 `.obsidian/plugins/obs-pico-shogi/` に 3 ファイルを配置。
3. Obsidian の `Settings → Community plugins` で **Pico Shogi Viewer** を有効化。

## 使い方

Reading mode でも Live Preview でも、次のコードブロックを書くと盤に置き換わります。

````markdown
```shogi-board
kif: startpos moves 7g7f 3c3d 8i7g 5a4b 7g6e 6a6b 7f7e 6c6d 8h2b+ 3a2b B*5e B*3c 5e6d 6b6c
nanteme: 6
teban: gote
```
````

`shogi-board` の代わりに `shogi` というフェンス名でも同じ動作になります。

### 属性

| キー | 必須 | 説明 |
|------|------|------|
| `kif` | はい | SFEN 局面 または USI 指し手列 |
| `teban` | いいえ | 盤の向き。`sente` / `gote`。既定は `sente` |
| `nanteme` | いいえ | 初期表示の手数。負値は末尾からの相対（`-1` で最終手） |
| `no-slider` | いいえ | truthy（`true`, `yes`, `1`, または値なし）でスライダー・再生ボタンを隠す |

### Live Preview の挙動

カーソル / 選択範囲がコードブロックに重なっている間は raw text として編集できます。コードブロックの外に出た瞬間に盤が描画されます。

### 表示のカスタマイズ

`Settings → Community plugins → Pico Shogi Viewer` の設定タブから、マスサイズ・盤の地色・罫線色・駒色などを CSS 値で上書きできます。空欄なら pico-shogi 標準の見た目になります。
