import { describe, expect, it } from 'vitest'
import type { AuthProvider, SessionUser } from './auth'
import { createApp } from './server'

/** resolve が固定ユーザを返すだけの provider。DB も Cookie も要らない。 */
function fixedAuth(user: SessionUser | null): AuthProvider {
  return {
    resolve: async () => user,
    signIn: async () => {},
    signOut: async () => {},
  }
}

const bob: SessionUser = { id: 'bob', name: 'Bob', email: 'bob@example.com' }

/** Inertia の遷移として叩き、page object を JSON で受け取る。 */
const inertiaGet = (path: string) => ({ headers: { 'X-Inertia': 'true' } }) as const

describe('GET /me', () => {
  it('ログイン中なら Me ページに user を渡す', async () => {
    const res = await createApp({ auth: fixedAuth(bob) }).request('/me', inertiaGet('/me'))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ component: 'Me', props: { user: bob } })
  })

  it('未ログインなら 401', async () => {
    const res = await createApp({ auth: fixedAuth(null) }).request('/me', inertiaGet('/me'))
    expect(res.status).toBe(401)
  })
})

describe('既存のノート', () => {
  it('認証を足しても /notes は未ログインで開ける', async () => {
    const res = await createApp({ auth: fixedAuth(null) }).request('/notes', inertiaGet('/notes'))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ component: 'Notes/Index' })
  })
})
