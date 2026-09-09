/**
 * サンプル用のインメモリ Note ストア。
 *
 * データは Worker の isolate のメモリ上にしかないので、`pnpm dev` を再起動したり
 * Cloudflare 側で isolate が入れ替わったりすると消える。本番用途にはならない
 * ——「Inertia のルーティングとフォームの書き方」を示すためだけの置き場所。
 * 実運用では D1 + Drizzle などに差し替える（README の「DB を足す」を参照）。
 */

export type Note = {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

/** フォームの入力値。エラー表示のために再レンダー時もそのまま返す。 */
export type NoteInput = { title: string; body: string }

/** フィールド名 → エラーメッセージ。エラーなしなら空。NoteInput から導出する。 */
export type NoteErrors = Partial<Record<keyof NoteInput, string>>

const now = () => new Date().toISOString()

// 初回アクセス時の見た目が空にならないようにサンプルを 1 件入れておく。
const seededAt = now()
const seed: Note = {
  id: 'welcome',
  title: 'ようこそ',
  body:
    'これは Hono + Inertia テンプレートのサンプルノートです。\n' +
    '編集・削除・新規作成をひととおり試せます。',
  createdAt: seededAt,
  updatedAt: seededAt,
}

const store = new Map<string, Note>([[seed.id, seed]])

/** 更新日時の新しい順に全件返す。 */
export function listNotes(): Note[] {
  return [...store.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function findNote(id: string): Note | undefined {
  return store.get(id)
}

/**
 * `id` / `now` は省略可。テストや UI シナリオで決定的な値を入れたいときだけ渡す
 * （並び順や表示時刻を固定してスクリーンショット比較を安定させる）。
 */
export function createNote(input: NoteInput, opts: { id?: string; now?: string } = {}): Note {
  const at = opts.now ?? now()
  const note: Note = {
    id: opts.id ?? crypto.randomUUID(),
    title: input.title,
    body: input.body,
    createdAt: at,
    updatedAt: at,
  }
  store.set(note.id, note)
  return note
}

export function updateNote(id: string, input: NoteInput): Note | undefined {
  const note = store.get(id)
  if (!note) return undefined
  const updated: Note = { ...note, ...input, updatedAt: now() }
  store.set(id, updated)
  return updated
}

export function deleteNote(id: string): boolean {
  return store.delete(id)
}

/** 全件削除。UI シナリオの初期化用で、本番ルートからは呼ばない。 */
export function clearNotes(): void {
  store.clear()
}

/** フォーム入力のバリデーション。正規化した値と、フィールドごとのエラーを返す。 */
export function validateNote(input: { title?: unknown; body?: unknown }): {
  ok: boolean
  errors: NoteErrors
  values: NoteInput
} {
  const errors: NoteErrors = {}
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const body = typeof input.body === 'string' ? input.body : ''

  if (!title) errors.title = 'タイトルは必須です'
  else if (title.length > 100) errors.title = 'タイトルは 100 文字以内で入力してください'
  if (body.length > 10000) errors.body = '本文は 10000 文字以内で入力してください'

  return { ok: Object.keys(errors).length === 0, errors, values: { title, body } }
}
