import type { Context } from 'hono'
import type { CookieOptions } from 'hono/utils/cookie'
import type { Bindings, Env } from '../env'

/**
 * AUTH_SECRET 未設定時の開発用フォールバック。
 * 本番では必ず `wrangler secret put AUTH_SECRET` で設定すること。
 */
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret'

export function authSecret(env: Bindings): string {
  return env.AUTH_SECRET || DEV_FALLBACK_SECRET
}

/** 認証系 Cookie に共通の属性。http のローカル開発でも動くよう secure は URL で決める。 */
export function authCookieOptions(c: Context<Env>): CookieOptions {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
  }
}

/** "1" / "true" / "yes" を真とみなす環境変数の読み方。 */
export function envFlag(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').trim().toLowerCase())
}
