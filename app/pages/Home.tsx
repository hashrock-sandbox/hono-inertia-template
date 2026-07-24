import { Link } from '@inertiajs/react'
import { Layout } from '../components/Layout'
import type { PageProps } from '../pages.gen'

// props の型は server.ts の `c.render('Home', { ... })` から自動で解決される。
export default function Home({ message, noteCount }: PageProps<'Home'>) {
  return (
    <Layout title="Home">
      <h1 className="text-3xl font-bold">{message}</h1>
      <p className="mt-3 text-neutral-500">
        サーバー駆動ルーティングのまま React を書くための最小テンプレートです。
        ルートは <code className="font-mono">app/server.ts</code>、ページは{' '}
        <code className="font-mono">app/pages/**</code> にあります。
      </p>
      <Link
        href="/notes"
        className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
      >
        Notes を見る（{noteCount} 件）
      </Link>
    </Layout>
  )
}
