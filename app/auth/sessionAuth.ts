import { signedAuthCookie } from './cookie'
import type { AuthProvider, SessionUser } from './provider'

const session = signedAuthCookie('session')

/**
 * セッションの保存先。本番では D1 などに差し替える。
 *
 * D1 に置き換える例:
 *   sessions(id TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER) を用意し、
 *   find → SELECT + users JOIN、create → INSERT、delete → DELETE を書くだけで
 *   sessionAuth 側は変更不要。
 */
export interface SessionStore {
  find(sessionId: string): Promise<SessionUser | null>
  /** セッションを作って id を返す。 */
  create(user: SessionUser): Promise<string>
  delete(sessionId: string): Promise<void>
}

/** スタブ実装。isolate のメモリにしか無いので本番では使わないこと。 */
export function memorySessionStore(): SessionStore {
  const sessions = new Map<string, SessionUser>()
  return {
    async find(id) {
      return sessions.get(id) ?? null
    },
    async create(user) {
      const id = crypto.randomUUID()
      sessions.set(id, user)
      return id
    },
    async delete(id) {
      sessions.delete(id)
    },
  }
}

/**
 * 本番用の AuthProvider。署名付きセッション Cookie の id を SessionStore で引く。
 * impersonate Cookie など、バイパス用の仕組みは一切見ない。
 */
export function sessionAuth(store: SessionStore = memorySessionStore()): AuthProvider {
  return {
    async resolve(c) {
      const sessionId = await session.read(c)
      return sessionId ? store.find(sessionId) : null
    },
    async signIn(c, user) {
      await session.write(c, await store.create(user))
    },
    async signOut(c) {
      const sessionId = await session.read(c)
      if (sessionId) await store.delete(sessionId)
      session.clear(c)
    },
  }
}
