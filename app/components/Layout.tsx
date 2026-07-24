import { Head, Link } from '@inertiajs/react'

/**
 * 全ページ共通のガワ。Inertia は「ページ単位で差し替える」モデルなので、
 * 共通レイアウトはこうしてコンポーネントとして各ページから呼ぶ。
 * （app/pages 配下に置くと Inertia のページ名として拾われるので components に置く）
 */
export function Layout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Head title={title} />
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/" className="font-semibold">
            hono-inertia
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/notes"
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Notes
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  )
}
