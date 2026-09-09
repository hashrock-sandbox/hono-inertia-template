import type { SessionUser } from './auth/provider'

/**
 * Worker のバインディング（D1 / KV / R2 / 環境変数）。
 * `wrangler.jsonc` に binding を追加したら `pnpm cf-typegen` で型を再生成できる。
 * ローカル開発の値は `.dev.vars`（`.dev.vars.example` を参照）に置く。
 * 各フラグの解釈もこのファイルに集める（isBypassEnabled など）。
 */
export type Bindings = {
  /** 真なら認証をバイパスし、固定の Dev User（または impersonate Cookie のユーザ）でログイン扱いにする。 */
  DEV_BYPASS_AUTH?: string
  /** DEV_BYPASS_AUTH の別名（共通仕様で両方の名前が許されている）。 */
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

const TRUTHY = new Set(['1', 'true', 'yes', 'on'])

/** "1" / "true" / "yes" / "on" を真とみなす環境変数の読み方。 */
export function envFlag(value: string | undefined): boolean {
  return TRUTHY.has((value ?? '').trim().toLowerCase())
}

export function isBypassEnabled(env: Bindings): boolean {
  return envFlag(env.DEV_BYPASS_AUTH) || envFlag(env.BYPASS_AUTH)
}

export function isScenariosEnabled(env: Bindings): boolean {
  return envFlag(env.SCENARIOS_ENABLED)
}

/**
 * AUTH_SECRET 未設定時は開発用の固定鍵にフォールバックする（`.dev.vars` 無しでも `pnpm dev` が動くように）。
 * 本番では必ず `wrangler secret put AUTH_SECRET` で設定すること。
 */
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret'

export function authSecret(env: Bindings): string {
  return env.AUTH_SECRET || DEV_FALLBACK_SECRET
}
