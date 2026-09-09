import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import type { Bindings } from '../env'
import { authCookieOptions, authSecret, envFlag } from './cookie'
import type { AuthProvider, SessionUser } from './provider'

/** signIn で書く「誰として入っているか」の署名 Cookie。sessionAuth はこれを一切読まない。 */
export const IMPERSONATE_COOKIE = 'impersonate'

/** バイパス時の既定ユーザ。impersonate Cookie が無いときはこの人になる。 */
export const DEV_USER: SessionUser = {
  id: 'dev-user',
  name: 'Dev User',
  email: 'dev@example.com',
}

export function isBypassEnabled(env: Bindings): boolean {
  return envFlag(env.DEV_BYPASS_AUTH) || envFlag(env.BYPASS_AUTH)
}

/**
 * 開発・UI テスト用の AuthProvider。DB を使わず、ユーザはインメモリに置く。
 *
 * - resolve : 署名付き impersonate Cookie があればそのユーザ、無ければ DEV_USER。
 *             `?guest=1` を付けると未ログイン状態を見られる（dev トグルはここに集める。ミドルウェアには置かない）。
 * - signIn  : ユーザを登録し、id を署名して Cookie に書く。
 * - signOut : Cookie を消す（次のリクエストからは DEV_USER に戻る）。
 *
 * isolate の再起動などで登録が消えた id は DEV_USER にフォールバックする。
 */
export function bypassAuth(): AuthProvider {
  const users = new Map<string, SessionUser>([[DEV_USER.id, DEV_USER]])

  return {
    async resolve(c) {
      if (c.req.query('guest') === '1') return null
      const id = await getSignedCookie(c, authSecret(c.env), IMPERSONATE_COOKIE)
      if (!id) return DEV_USER
      return users.get(id) ?? DEV_USER
    },
    async signIn(c, user) {
      users.set(user.id, user)
      await setSignedCookie(c, IMPERSONATE_COOKIE, user.id, authSecret(c.env), authCookieOptions(c))
    },
    async signOut(c) {
      deleteCookie(c, IMPERSONATE_COOKIE, { path: '/' })
    },
  }
}
