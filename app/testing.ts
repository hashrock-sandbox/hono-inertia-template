import type { AuthProvider, SessionUser } from './auth'

/**
 * テスト用の AuthProvider。resolve は固定ユーザを返すだけで、Cookie も DB も触らない。
 * signIn に渡されたユーザを見たいときは onSignIn を渡す。
 */
export function stubAuth(user: SessionUser | null, onSignIn?: (user: SessionUser) => void): AuthProvider {
  return {
    resolve: async () => user,
    signIn: async (_c, u) => onSignIn?.(u),
    signOut: async () => {},
  }
}

/** Inertia の遷移として叩き、HTML ではなく page object を JSON で受け取るためのヘッダ。 */
export const inertiaRequest = { headers: { 'X-Inertia': 'true' } } as const
