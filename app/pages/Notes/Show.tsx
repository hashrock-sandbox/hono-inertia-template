import { Link, router } from '@inertiajs/react'
import { Layout } from '../../components/Layout'
import type { PageProps } from '../../pages.gen'

export default function NoteShow({ note }: PageProps<'Notes/Show'>) {
  const destroy = () => {
    if (!confirm(`「${note.title}」を削除しますか？`)) return
    // GET 以外の遷移は router.delete / router.post などで投げる。
    // サーバーが 303 で返したリダイレクト先へそのまま遷移する。
    router.delete(`/notes/${note.id}`)
  }

  return (
    <Layout title={note.title}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/notes/${note.id}/edit`}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-900 dark:border-neutral-700 dark:hover:border-white"
          >
            編集
          </Link>
          <button
            onClick={destroy}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-red-600 hover:border-red-500 dark:border-neutral-700"
          >
            削除
          </button>
        </div>
      </div>

      <p className="whitespace-pre-wrap leading-relaxed">{note.body}</p>

      <p className="mt-8 text-xs text-neutral-500">
        更新: {new Date(note.updatedAt).toLocaleString('ja-JP')}
      </p>

      <Link href="/notes" className="mt-6 inline-block text-sm text-neutral-500 hover:underline">
        ← 一覧に戻る
      </Link>
    </Layout>
  )
}
