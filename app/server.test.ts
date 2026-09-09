import { describe, expect, it } from 'vitest'
import type { SessionUser } from './auth'
import { createApp } from './server'
import { inertiaRequest, stubAuth } from './testing'

const bob: SessionUser = { id: 'bob', name: 'Bob', email: 'bob@example.com' }

describe('GET /me', () => {
  it('ログイン中なら Me ページに user を渡す', async () => {
    const res = await createApp({ auth: stubAuth(bob) }).request('/me', inertiaRequest)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ component: 'Me', props: { user: bob } })
  })

  it('未ログインなら 401', async () => {
    const res = await createApp({ auth: stubAuth(null) }).request('/me', inertiaRequest)
    expect(res.status).toBe(401)
  })
})

describe('既存のノート', () => {
  it('認証を足しても /notes は未ログインで開ける', async () => {
    const res = await createApp({ auth: stubAuth(null) }).request('/notes', inertiaRequest)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ component: 'Notes/Index' })
  })
})
