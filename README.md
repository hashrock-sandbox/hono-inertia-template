# hono-inertia-template

**Hono + [Inertia.js](https://inertiajs.com) + React** のテンプレート。
サーバー駆動のルーティングのまま React を書けて、REST API 層もクライアントルーターも要りません。
Cloudflare Workers にそのままデプロイできます。

```ts
// app/server.ts — ルートが即ページ
app.get('/notes/:id', (c) => c.render('Notes/Show', { note }))
```

```tsx
// app/pages/Notes/Show.tsx — props は型付きで届く
export default function NoteShow({ note }: PageProps<'Notes/Show'>) { ... }
```

## 構成

| | |
| --- | --- |
| サーバー | [Hono](https://hono.dev) + [`@hono/inertia`](https://github.com/honojs/middleware/tree/main/packages/inertia) |
| クライアント | React 19 + `@inertiajs/react` |
| スタイル | Tailwind CSS v4 |
| ビルド | Vite + `@cloudflare/vite-plugin` + `vite-ssr-components` |
| 実行環境 | Cloudflare Workers |

```
app/
  server.ts          ルート定義（ここが唯一のルーティング定義）
  client.tsx         Inertia クライアントの起動
  root-view.tsx      SSR する HTML シェル
  styles.css         Tailwind エントリ
  env.ts             Worker の環境型（バインディングを足す場所）
  notes.ts           サンプルのインメモリストア
  pages.gen.ts       ページ名と props 型（vite が自動生成）
  pages/**           Inertia ページ（ファイル名 = c.render の第1引数）
  components/        ページではない共通コンポーネント
public/              静的アセット（そのまま配信される）
```

## 開発

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck    # tsc --noEmit
pnpm build        # dist/ に本番ビルド
pnpm preview      # ビルドしてローカルで確認
```

## デプロイ

```sh
pnpm deploy       # wrangler deploy
```

`wrangler.jsonc` の `name` はプロジェクト名に書き換えてください。

## 仕組みの要点

### ページの追加

1. `app/pages/Foo.tsx` を作って default export する
2. `app/server.ts` に `.get('/foo', (c) => c.render('Foo', { ... }))` を足す

`c.render` の第1引数は `app/pages/**` から自動生成される `PageName` に制約されるので、
存在しないページ名はコンパイルエラーになります。ページ側は
`PageProps<'Foo'>` でハンドラが渡した props の型をそのまま受け取れます。

ルートは `const routes = app.get(...).post(...)` とメソッドチェーンで書いてください。
チェーンを切って `app.get(...)` を個別に呼ぶと型が積み上がらず、`PageProps` が解決できません。

### フォームと遷移

- ページ間リンクは `<Link href="...">`、非 GET は `router.post/put/delete` か `useForm`
- 送信後は **303** でリダイレクトする（302 だとブラウザが同じメソッドで追いかける）
- バリデーションエラーは同じページを `errors` props 付きで再レンダーして返す
  （`app/server.ts` の `POST /notes` を参照）。非 GET のときの `page.url` は
  `Referer` が使われるため、アドレスバーはフォームの URL のまま保たれます

### データの保存先

サンプルの Notes は **`app/notes.ts` のインメモリ Map** に入っているだけで、
サーバーを再起動すると消えます。永続化するときは以下のどちらかに差し替えてください。

**Cloudflare D1 + Drizzle ORM**

```sh
pnpm add drizzle-orm && pnpm add -D drizzle-kit
pnpm wrangler d1 create <db-name>       # 出力の database_id を wrangler.jsonc に
```

`wrangler.jsonc` のコメントアウトされた `d1_databases` を有効化し、
`app/env.ts` の `Bindings` に `DB: D1Database` を足すと `c.env.DB` が型付きで使えます。
あとは `app/notes.ts` の各関数を Drizzle のクエリに置き換えるだけです。

**Cloudflare KV** — 単純な key-value でよければ `kv_namespaces` を足すのが最短です。

### 認証

このテンプレートには含めていません。追加するなら Hono のミドルウェアで
`c.set('user', ...)` し、`app/env.ts` の `Variables` に型を足すのが素直です。

## メモ

- `vite.config.ts` の `ssrPlugin` はクライアントのビルドエントリを
  `app/root-view.tsx` の `<Script src>` / `<Link href>` から検出します。探索対象を
  `app/**` に広げると Inertia の `<Link href="/notes">` まで拾ってビルドが壊れるので注意
- `@vitejs/plugin-react` は入れていません。Fast Refresh のプリアンブルが
  カスタム SSR ドキュメントに注入されず、ハイドレーションが壊れるためです
  （JSX の変換は tsconfig の `jsx: react-jsx` により esbuild が行います）
