import { signedAuthCookie } from './cookie'
import { parseSessionUser, type AuthProvider, type SessionUser } from './provider'

/** signIn で書く「誰として入っているか」の署名 Cookie。sessionAuth はこれを一切読まない。 */
export const IMPERSONATE_COOKIE = 'impersonate'

/** バイパス時の既定ユーザ。impersonate Cookie が無いときはこの人になる。 */
export const DEV_USER: SessionUser = {
  id: 'dev-user',
  name: 'Dev User',
  email: 'dev@example.com',
}

/** signOut が書く値。Cookie を消すと Dev User に戻ってしまうので、「未ログイン」も Cookie で表す。 */
const GUEST = 'guest'

const impersonate = signedAuthCookie(IMPERSONATE_COOKIE)

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/**
 * 開発・UI テスト用の AuthProvider。DB を使わず、ユーザは署名 Cookie にそのまま載せる。
 *
 * - resolve : impersonate Cookie があればそのユーザ、`guest` なら未ログイン、無ければ DEV_USER。
 * - signIn  : ユーザを JSON にして署名 Cookie に書く（ストア不要なので isolate 再起動でも消えない）。
 * - signOut : `guest` を書く。未ログイン状態を見たいときは /auth/signout を叩けばよい。
 */
export const bypassAuth: AuthProvider = {
  async resolve(c) {
    const value = await impersonate.read(c)
    if (!value) return DEV_USER
    if (value === GUEST) return null
    return parseSessionUser(parseJson(value)) ?? DEV_USER
  },
  signIn: (c, user) => impersonate.write(c, JSON.stringify(user)),
  signOut: (c) => impersonate.write(c, GUEST),
}
