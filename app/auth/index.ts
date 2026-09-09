import { isBypassEnabled } from '../env'
import { bypassAuth } from './bypassAuth'
import type { AuthProvider } from './provider'
import { sessionAuth } from './sessionAuth'

export type { AuthProvider, SessionUser } from './provider'
export { authMiddleware, requireUser } from './middleware'
export { bypassAuth, DEV_USER, IMPERSONATE_COOKIE } from './bypassAuth'
export { sessionAuth, type SessionStore } from './sessionAuth'

/**
 * 本番 / バイパスの選択。ここが唯一の分岐点で、createApp() の既定値になる。
 * 差し替えたいときは createApp({ auth }) に provider を渡す。
 *
 * Workers では env がリクエストごとにしか手に入らないので、各メソッドで c.env を見て委譲する。
 * バイパス無効時は sessionAuth しか呼ばれないため、impersonate Cookie は完全に無視される。
 */
export function authFromEnv(): AuthProvider {
  const session = sessionAuth()
  const pick = (c: Parameters<AuthProvider['resolve']>[0]) =>
    isBypassEnabled(c.env) ? bypassAuth : session
  return {
    resolve: (c) => pick(c).resolve(c),
    signIn: (c, user) => pick(c).signIn(c, user),
    signOut: (c) => pick(c).signOut(c),
  }
}
