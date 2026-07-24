import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import ssrPlugin from 'vite-ssr-components/plugin'
import { inertiaPages } from '@hono/inertia/vite'

export default defineConfig({
  // React JSX is transformed by esbuild via tsconfig (jsx: react-jsx).
  // No @vitejs/plugin-react — its Fast Refresh preamble isn't injected into
  // our custom Inertia SSR document, which would break hydration.
  plugins: [
    inertiaPages(),
    tailwindcss(),
    cloudflare(),
    // ssrPlugin は <Script src> / <Link href> を走査してクライアントの
    // ビルドエントリを決める。既定の探索先は src/ で、app/ 全体を対象にすると
    // Inertia の <Link href="/notes"> まで拾ってしまうため root-view.tsx に絞る。
    ssrPlugin({ entry: { target: 'app/root-view.tsx' } }),
  ],
})
