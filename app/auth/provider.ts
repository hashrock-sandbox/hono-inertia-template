import type { Context } from 'hono'
import type { Env } from '../env'

/** ログイン中のユーザ。セッションや Cookie に載せる最小限の情報だけを持つ。 */
export type SessionUser = {
  id: string
  name: string
  email: string
}

/**
 * 認証の差し替え口。アプリはこの interface だけに依存し、
 * 「本番はセッション Cookie + DB」「開発はバイパス」「テストは固定ユーザ」を
 * createApp({ auth }) で入れ替える。
 */
export interface AuthProvider {
  /** 毎リクエスト、ミドルウェアが呼ぶ。null = 未ログイン */
  resolve(c: Context<Env>): Promise<SessionUser | null>
  /** 以後のリクエストで resolve(c) が user を返すようにする（ブラウザは複数リクエストをまたぐので状態が要る） */
  signIn(c: Context<Env>, user: SessionUser): Promise<void>
  signOut(c: Context<Env>): Promise<void>
}

/** 署名 Cookie に載せる前に、形が SessionUser かどうかを確かめる。 */
export function parseSessionUser(value: unknown): SessionUser | null {
  if (typeof value !== 'object' || value === null) return null
  const { id, name, email } = value as Record<string, unknown>
  if (typeof id !== 'string' || typeof name !== 'string' || typeof email !== 'string') return null
  return { id, name, email }
}
