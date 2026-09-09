import type { Context } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'
import { authSecret, type Env } from '../env'

/** 認証系 Cookie に共通の属性。http のローカル開発でも動くよう secure は URL で決める。 */
export function authCookieOptions(c: Context<Env>): CookieOptions {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.req.url.startsWith('https:'),
  }
}

/** AUTH_SECRET で署名する Cookie の読み書き。sessionAuth と bypassAuth が名前だけ変えて使う。 */
export function signedAuthCookie(name: string) {
  return {
    /** 署名が正しければ値、無ければ undefined、改竄されていれば false。 */
    read: (c: Context<Env>) => getSignedCookie(c, authSecret(c.env), name),
    write: (c: Context<Env>, value: string) =>
      setSignedCookie(c, name, value, authSecret(c.env), authCookieOptions(c)),
    clear: (c: Context<Env>) => {
      deleteCookie(c, name, authCookieOptions(c))
    },
  }
}
