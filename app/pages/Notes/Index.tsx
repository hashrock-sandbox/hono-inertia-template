import { Link } from '@inertiajs/react'
import { Layout } from '../../components/Layout'
import type { PageProps } from '../../pages.gen'

export default function NotesIndex({ notes }: PageProps<'Notes/Index'>) {
  return (
    <Layout title="Notes">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Link
          href="/notes/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          + 新規作成
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 py-16 text-center text-neutral-500 dark:border-neutral-800">
          まだノートがありません。
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="block py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <div className="font-medium">{note.title}</div>
                <div className="mt-1 truncate text-sm text-neutral-500">
                  {note.body || '（本文なし）'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  )
}
