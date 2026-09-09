import type { Context, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../env'
import type { AuthProvider, SessionUser } from './provider'

/**
 * 毎リクエスト `c.get('user')` を埋める。やることはこれだけで、
 * バイパスや impersonate の分岐は provider の中に閉じる。
 */
export function authMiddleware(auth: AuthProvider): MiddlewareHandler<Env> {
  return async (c, next) => {
    c.set('user', await auth.resolve(c))
    await next()
  }
}

/** ログイン必須のハンドラで使う。未ログインなら 401 を投げる。 */
export function requireUser(c: Context<Env>): SessionUser {
  const user = c.get('user')
  if (!user) throw new HTTPException(401, { message: 'ログインが必要です' })
  return user
}
