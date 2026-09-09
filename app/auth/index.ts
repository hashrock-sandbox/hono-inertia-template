import { bypassAuth, isBypassEnabled } from './bypassAuth'
import type { AuthProvider } from './provider'
import { sessionAuth } from './sessionAuth'

export type { AuthProvider, SessionUser } from './provider'
export { authMiddleware, requireUser } from './middleware'
export { bypassAuth, DEV_USER, isBypassEnabled } from './bypassAuth'
export { sessionAuth, memorySessionStore, type SessionStore } from './sessionAuth'

/**
 * 本番 / バイパスの選択。ここが唯一の分岐点で、createApp() の既定値になる。
 *
 * Workers では env がリクエストごとにしか手に入らないので、provider 自体は
 * 両方を先に作っておき、各メソッドで c.env を見て委譲する。
 * バイパス無効時は sessionAuth しか呼ばれないため、impersonate Cookie は完全に無視される。
 */
export function authFromEnv(
  providers: { session: AuthProvider; bypass: AuthProvider } = {
    session: sessionAuth(),
    bypass: bypassAuth(),
  }
): AuthProvider {
  const pick = (env: Parameters<typeof isBypassEnabled>[0]) =>
    isBypassEnabled(env) ? providers.bypass : providers.session
  return {
    resolve: (c) => pick(c.env).resolve(c),
    signIn: (c, user) => pick(c.env).signIn(c, user),
    signOut: (c) => pick(c.env).signOut(c),
  }
}
