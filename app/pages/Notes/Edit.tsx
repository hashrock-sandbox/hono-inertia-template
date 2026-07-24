import { Link, useForm } from '@inertiajs/react'
import { Layout } from '../../components/Layout'
import type { PageProps } from '../../pages.gen'

export default function NoteEdit({ note, values, errors }: PageProps<'Notes/Edit'>) {
  const { data, setData, put, processing } = useForm(values)

  return (
    <Layout title={`${note.title} を編集`}>
      <h1 className="mb-6 text-2xl font-bold">ノートを編集</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          put(`/notes/${note.id}`)
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
            {processing ? '保存中…' : '保存'}
          </button>
          <Link href={`/notes/${note.id}`} className="text-sm text-neutral-500 hover:underline">
            キャンセル
          </Link>
        </div>
      </form>
    </Layout>
  )
}
