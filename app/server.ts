import { Hono } from 'hono'
import { inertia } from '@hono/inertia'
import { rootView } from './root-view'
import {
  createNote,
  deleteNote,
  findNote,
  listNotes,
  updateNote,
  validateNote,
} from './notes'
import type { Env } from './global.d'

const app = new Hono<Env>()

// Inertia ミドルウェア。これで `c.render(component, props)` が使えるようになる。
// - 通常のアクセス   → rootView の HTML を返す
// - Inertia の遷移   → page object を JSON で返す
app.use(inertia({ rootView }))

/**
 * Inertia の `useForm` は既定で JSON を送るが、JS 無効時の素の <form> POST や
 * ファイル添付時は FormData で飛んでくる。どちらでも受けられるようにしておく。
 */
async function readBody(c: { req: { json: () => Promise<unknown>; parseBody: () => Promise<Record<string, unknown>> } }) {
  try {
    return (await c.req.json()) as Record<string, unknown>
  } catch {
    return await c.req.parseBody()
  }
}

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
      errors: {} as Record<string, string>,
    })
  )

  // 作成
  .post('/notes', async (c) => {
    const body = await readBody(c)
    const { errors, values } = validateNote(body)
    // エラーがあれば同じページを props 付きで返すだけ。Inertia が差分を
    // 差し替えるので、入力内容を保ったままエラーを表示できる。
    // 非 GET の page.url は Referer が使われるのでアドレスバーは
    // /notes/new のまま。明示するなら c.render(name, props, { url: '/notes/new' })。
    if (Object.keys(errors).length > 0) {
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
      errors: {} as Record<string, string>,
    })
  })

  // 更新
  .put('/notes/:id', async (c) => {
    const note = findNote(c.req.param('id'))
    if (!note) return c.notFound()
    const { errors, values } = validateNote(await readBody(c))
    if (Object.keys(errors).length > 0) {
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

export default routes
