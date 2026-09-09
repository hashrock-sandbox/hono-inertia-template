import { defineConfig } from 'vitest/config'

// vite.config.ts の Cloudflare プラグインはテストには不要なので、別設定で素の Node 上で走らせる。
// 署名 Cookie に使う crypto.subtle は Node 20+ でグローバルに使える。
export default defineConfig({
  test: {
    include: ['app/**/*.test.ts'],
    environment: 'node',
  },
})
