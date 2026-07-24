import { Link, useForm } from '@inertiajs/react'
import { Layout } from '../../components/Layout'
import type { PageProps } from '../../pages.gen'

export default function NoteNew({ values, errors }: PageProps<'Notes/New'>) {
  // useForm がフォームの状態と送信中フラグを持つ。
  // errors は props（server.ts がバリデーション失敗時に返したもの）を使う。
  const { data, setData, post, processing } = useForm(values)

  return (
    <Layout title="新規ノート">
      <h1 className="mb-6 text-2xl font-bold">新規ノート</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          post('/notes')
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
            {processing ? '作成中…' : '作成'}
          </button>
          <Link href="/notes" className="text-sm text-neutral-500 hover:underline">
            キャンセル
          </Link>
        </div>
      </form>
    </Layout>
  )
}
