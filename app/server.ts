import { Hono, type Context } from 'hono'
import { inertia } from '@hono/inertia'
import { rootView } from './root-view'
import {
  createNote,
  deleteNote,
  findNote,
  listNotes,
  updateNote,
  validateNote,
  type NoteErrors,
} from './notes'
import type { Env } from './env'
import { authFromEnv, authMiddleware, requireUser, type AuthProvider } from './auth'
import { scenarioRoutes } from './scenarios'

/**
 * Inertia の `useForm` は既定で JSON を送るが、JS 無効時の素の <form> POST や
 * ファイル添付時は FormData で飛んでくる。どちらでも受けられるようにしておく。
 */
async function readBody(c: Context<Env>) {
  try {
    return (await c.req.json()) as Record<string, unknown>
  } catch {
    return await c.req.parseBody()
  }
}

export type AppOptions = {
  /**
   * 認証の実装。省略時は env で本番（sessionAuth）/ バイパス（bypassAuth）を選ぶ。
   * テストでは resolve が固定ユーザを返すモックを渡せば DB なしでハンドラを検証できる。
   */
  auth?: AuthProvider
}

/**
 * アプリを組み立てる。Worker のエントリ（default export）はこれを引数なしで呼んだもの。
 * ルートをこの中に書くのは、`auth` を差し替えたインスタンスをテストで作れるようにするため。
 */
export function createApp({ auth = authFromEnv() }: AppOptions = {}) {
  const app = new Hono<Env>()

  // Inertia ミドルウェア。これで `c.render(component, props)` が使えるようになる。
  // - 通常のアクセス   → rootView の HTML を返す
  // - Inertia の遷移   → page object を JSON で返す
  app.use(inertia({ rootView }))

  // 毎リクエスト c.get('user') を埋める。分岐は provider の中に閉じる。
  app.use(authMiddleware(auth))

  // ルートは `const routes = app.get(...)...` とメソッドチェーンで書く。
  // こうすると型が積み上がり、pages.gen.ts 経由で `PageProps<'Notes/Index'>` が
  // このハンドラの props 型に解決される（app.get(...) を個別に呼ぶと推論が切れる）。
  const routes = app
    .get('/', (c) =>
      c.render('Home', {
        message: 'Hono + Inertia',
        noteCount: listNotes().length,
      })
    )

    // 一覧
    .get('/notes', (c) => c.render('Notes/Index', { notes: listNotes() }))

    // 新規作成フォーム
    .get('/notes/new', (c) =>
      c.render('Notes/New', {
        values: { title: '', body: '' },
        errors: {} as NoteErrors,
      })
    )

    // 作成
    .post('/notes', async (c) => {
      const { ok, errors, values } = validateNote(await readBody(c))
      // エラーがあれば同じページを props 付きで返すだけ。Inertia が差分を
      // 差し替えるので、入力内容を保ったままエラーを表示できる。
      // 非 GET の page.url は Referer が使われるのでアドレスバーは
      // /notes/new のまま。明示するなら c.render(name, props, { url: '/notes/new' })。
      if (!ok) {
        return c.render('Notes/New', { values, errors })
      }
      const note = createNote(values)
      // POST / PUT / DELETE のあとは 303 でリダイレクトする（302 だと
      // ブラウザが同じメソッドで追いかけてしまう）。
      return c.redirect(`/notes/${note.id}`, 303)
    })

    // 詳細
    .get('/notes/:id', (c) => {
      const note = findNote(c.req.param('id'))
      if (!note) return c.notFound()
      return c.render('Notes/Show', { note })
    })

    // 編集フォーム
    .get('/notes/:id/edit', (c) => {
      const note = findNote(c.req.param('id'))
      if (!note) return c.notFound()
      return c.render('Notes/Edit', {
        note,
        values: { title: note.title, body: note.body },
        errors: {} as NoteErrors,
      })
    })

    // 更新
    .put('/notes/:id', async (c) => {
      const note = findNote(c.req.param('id'))
      if (!note) return c.notFound()
      const { ok, errors, values } = validateNote(await readBody(c))
      if (!ok) {
        return c.render('Notes/Edit', { note, values, errors })
      }
      updateNote(note.id, values)
      return c.redirect(`/notes/${note.id}`, 303)
    })

    // 削除
    .delete('/notes/:id', (c) => {
      deleteNote(c.req.param('id'))
      return c.redirect('/notes', 303)
    })

    // ログイン必須ページの例。requireUser が未ログインなら 401 を投げる。
    .get('/me', (c) => c.render('Me', { user: requireUser(c) }))

    // ログアウト。Google OAuth の callback など「ログインさせる」処理も同様に
    // auth.signIn(c, user) を 1 回呼ぶだけにして、Cookie の書き方を各所に複製しない。
    .post('/auth/signout', async (c) => {
      await auth.signOut(c)
      return c.redirect('/', 303)
    })

    // UI テスト用シナリオ（SCENARIOS_ENABLED が真のときだけ応答）
    .route('/__scenarios', scenarioRoutes(auth))

  return routes
}

const app = createApp()

export default app
