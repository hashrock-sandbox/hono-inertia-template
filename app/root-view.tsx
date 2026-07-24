import { renderToString } from 'react-dom/server'
import { Link, Script, ViteClient } from 'vite-ssr-components/react'
import { serializePage, type PageObject, type RootView } from '@hono/inertia'

/**
 * Inertia アプリを起動する HTML シェル。
 * `data-page` の script に page object が入り、client.tsx がそれを読んで
 * `#app` にマウントする。<title> は各ページの <Head> が上書きする。
 */
const Document = ({ page }: { page: PageObject }) => (
  <html lang="ja">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>hono-inertia-template</title>
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <ViteClient />
      <Script src="/app/client.tsx" />
      <Link href="/app/styles.css" rel="stylesheet" />
    </head>
    <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <script
        data-page="app"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: serializePage(page) }}
      />
      <div id="app" />
    </body>
  </html>
)

export const rootView: RootView = (page) =>
  '<!DOCTYPE html>' + renderToString(<Document page={page} />)
