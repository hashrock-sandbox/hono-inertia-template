import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

createInertiaApp({
  // `c.render('Notes/Index', ...)` の文字列が、そのまま app/pages 配下の
  // ファイルパスに対応する（Notes/Index → ./pages/Notes/Index.tsx）。
  resolve: async (name) => {
    const pages = import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx')
    const page = await pages[`./pages/${name}.tsx`]()
    return page.default
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
