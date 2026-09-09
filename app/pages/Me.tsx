import { router } from '@inertiajs/react'
import { Layout } from '../components/Layout'
import type { PageProps } from '../pages.gen'

/** ログイン必須ページの例。props の user は requireUser(c) が保証する。 */
export default function Me({ user }: PageProps<'Me'>) {
  return (
    <Layout title="Me">
      <h1 className="text-2xl font-bold">{user.name}</h1>
      <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
        <dt className="text-neutral-500">id</dt>
        <dd className="font-mono">{user.id}</dd>
        <dt className="text-neutral-500">email</dt>
        <dd className="font-mono">{user.email}</dd>
      </dl>
      <button
        onClick={() => router.post('/auth/signout')}
        className="mt-8 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-900 dark:border-neutral-700 dark:hover:border-white"
      >
        ログアウト
      </button>
    </Layout>
  )
}
