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
  auth/              AuthProvider（本番: sessionAuth / 開発: bypassAuth）とミドルウェア
  scenarios/         UI テスト用シナリオ（/__scenarios/*、SCENARIOS_ENABLED 時のみ）
  notes.ts           サンプルのインメモリストア
  pages.gen.ts       ページ名と props 型（vite が自動生成）
  pages/**           Inertia ページ（ファイル名 = c.render の第1引数）
  components/        ページではない共通コンポーネント
public/              静的アセット（そのまま配信される）
```

## 開発

```sh
pnpm install
cp .dev.vars.example .dev.vars   # 認証バイパスとシナリオを有効にする（任意）
pnpm dev          # http://localhost:5173
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
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

### 認証を足す

認証は `app/auth/provider.ts` の **AuthProvider** に切り出してあり、アプリはこの interface だけに依存します。

```ts
export interface AuthProvider {
  resolve(c): Promise<SessionUser | null>   // 毎リクエスト、ミドルウェアが呼ぶ
  signIn(c, user): Promise<void>            // 以後の resolve が user を返すようにする
  signOut(c): Promise<void>
}
```

| 実装 | いつ選ばれるか | 中身 |
| --- | --- | --- |
| `sessionAuth` | 既定（本番） | 署名付きセッション Cookie の id を `SessionStore` で引く。ストアはインメモリのスタブなので D1 に差し替える |
| `bypassAuth` | `DEV_BYPASS_AUTH=1`（または `BYPASS_AUTH=1`） | 署名付き `impersonate` Cookie にユーザをそのまま載せる。Cookie が無ければ Dev User。`/auth/signout` すると未ログイン状態になる |

選択は `app/auth/index.ts` の `authFromEnv()` が 1 箇所で行い、`createApp({ auth })` の既定値になります。
ミドルウェア（`app/auth/middleware.ts`）は `c.set('user', await auth.resolve(c))` するだけで、
バイパスや impersonate の分岐は provider の中に閉じています。バイパス無効時は `sessionAuth` しか呼ばれないので、
impersonate Cookie を渡しても無視されます（`app/auth/auth.test.ts` で固定）。

**実際にログインを組み込む手順**

1. `app/auth/sessionAuth.ts` の `SessionStore` を D1 実装に置き換える（`memorySessionStore` と同じ 3 メソッド）
2. Google OAuth などの callback ルートで `await auth.signIn(c, user)` を呼ぶ。Cookie の書き方を各所に複製しない
3. ログイン必須のハンドラでは `requireUser(c)` を使う（未ログインなら 401。`GET /me` が例）
4. 本番には `wrangler secret put AUTH_SECRET` で署名鍵を入れる（未設定時は開発用の固定鍵で動く）

ハンドラの単体テストは、`resolve` が固定ユーザを返すだけのモック provider を `createApp({ auth })` に渡せば
DB も Cookie も無しで書けます（`app/server.test.ts`）。

### UI テスト用シナリオ

ブラウザテスト（Playwright など）が「ログインして、決まった状態の画面を開く」を 1 回の GET で済ませるための仕組みです。
`.dev.vars` で `SCENARIOS_ENABLED=1` のときだけ応答し、それ以外は 404 です。

| URL | 動き |
| --- | --- |
| `GET /__scenarios` | シナリオの一覧ページ |
| `GET /__scenarios/empty` | ノート 0 件にして 303 → `/notes` |
| `GET /__scenarios/typical` | ノート 3 件を固定の id・時刻で作って 303 → `/notes` |
| `GET /__scenarios/<name>?format=json` | 遷移せず、作ったユーザと状態を JSON で返す |

各シナリオは使い捨てユーザを作って **`auth.signIn(c, user)` を呼ぶだけ**で、Cookie やミドルウェアには触りません。
シナリオの定義は `app/scenarios/definitions.ts` に足します。`createNote` は `{ id, now }` を受け取れるので、
表示順や日時を固定してスクリーンショット比較を安定させられます。

## メモ

- `vite.config.ts` の `ssrPlugin` はクライアントのビルドエントリを
  `app/root-view.tsx` の `<Script src>` / `<Link href>` から検出します。探索対象を
  `app/**` に広げると Inertia の `<Link href="/notes">` まで拾ってビルドが壊れるので注意
- `@vitejs/plugin-react` は入れていません。Fast Refresh のプリアンブルが
  カスタム SSR ドキュメントに注入されず、ハイドレーションが壊れるためです
  （JSX の変換は tsconfig の `jsx: react-jsx` により esbuild が行います）
