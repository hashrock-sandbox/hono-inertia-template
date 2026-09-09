import type { SessionUser } from './auth/provider'

/**
 * Worker のバインディング（D1 / KV / R2 / 環境変数）。
 * `wrangler.jsonc` に binding を追加したら `pnpm cf-typegen` で型を再生成できる。
 * ローカル開発の値は `.dev.vars`（`.dev.vars.example` を参照）に置く。
 */
export type Bindings = {
  /** 真なら認証をバイパスし、固定の Dev User（または impersonate Cookie のユーザ）でログイン扱いにする。 */
  DEV_BYPASS_AUTH?: string
  /** DEV_BYPASS_AUTH の別名（他リポジトリとの互換用）。 */
  BYPASS_AUTH?: string
  /** Cookie 署名の秘密鍵。本番では必ず設定する。 */
  AUTH_SECRET?: string
  /** 真なら `/__scenarios/*` を有効にする。本番では設定しない。 */
  SCENARIOS_ENABLED?: string
  // 例: DB: D1Database
}

export type Env = {
  Bindings: Bindings
  Variables: {
    /** authMiddleware がセットする。null = 未ログイン。 */
    user: SessionUser | null
  }
}
