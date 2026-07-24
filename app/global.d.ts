/**
 * Worker の環境型。バインディング（D1 / KV / R2 / 環境変数）を足すときはここに書く。
 *
 * 例:
 *   Bindings: { DB: D1Database; SESSION_SECRET: string }
 * `wrangler.jsonc` に binding を追加したら `pnpm cf-typegen` で型を再生成できる。
 */
export type Env = {
  Bindings: Record<string, never>
  Variables: Record<string, never>
}
