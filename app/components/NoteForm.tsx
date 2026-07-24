import { Link } from '@inertiajs/react'
import type { NoteErrors, NoteInput } from '../notes'

/**
 * 新規作成と編集で共有するフォーム本体。
 * `useForm` の呼び出し（＝送信先とメソッドの決定）は各ページに残し、
 * ここは入力欄とエラー表示だけを受け持つ。
 */
export function NoteForm({
  data,
  setData,
  errors,
  processing,
  onSubmit,
  submitLabel,
  cancelHref,
}: {
  data: NoteInput
  setData: (key: keyof NoteInput, value: string) => void
  errors: NoteErrors
  processing: boolean
  onSubmit: () => void
  submitLabel: string
  cancelHref: string
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          タイトル
        </label>
        <input
          id="title"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium">
          本文
        </label>
        <textarea
          id="body"
          rows={10}
          value={data.body}
          onChange={(e) => setData('body', e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
        {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={processing}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {processing ? '送信中…' : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-neutral-500 hover:underline">
          キャンセル
        </Link>
      </div>
    </form>
  )
}
