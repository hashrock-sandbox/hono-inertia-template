import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import type { Bindings, Env } from '../env'
import {
  authFromEnv,
  authMiddleware,
  bypassAuth,
  DEV_USER,
  IMPERSONATE_COOKIE,
  sessionAuth,
  type AuthProvider,
  type SessionUser,
} from './index'

const alice: SessionUser = { id: 'alice', name: 'Alice', email: 'alice@example.com' }

/** provider をミドルウェアに載せ、signIn / whoami / signOut だけを持つ最小アプリ。 */
function harness(auth: AuthProvider) {
  return new Hono<Env>()
    .use(authMiddleware(auth))
    .get('/whoami', (c) => c.json({ user: c.get('user') }))
    .post('/signin', async (c) => {
      await auth.signIn(c, alice)
      return c.text('ok')
    })
    .post('/signout', async (c) => {
      await auth.signOut(c)
      return c.text('ok')
    })
}

/** Workers と同じく c.env が必ず object になるよう、env を省略しても {} を渡す。 */
function post(app: ReturnType<typeof harness>, path: string, cookie = '', env: Bindings = {}) {
  return app.request(path, { method: 'POST', headers: { Cookie: cookie } }, env)
}

/** Set-Cookie から次のリクエストに乗せる Cookie ヘッダを組み立てる。 */
function cookieHeader(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((line) => line.split(';')[0])
    .join('; ')
}

async function whoami(app: ReturnType<typeof harness>, cookie: string, env: Bindings = {}) {
  const res = await app.request('/whoami', { headers: { Cookie: cookie } }, env)
  return (await res.json()) as { user: SessionUser | null }
}

/** バイパス provider で alice としてログインしたときの署名 impersonate Cookie。 */
async function impersonateCookie(): Promise<string> {
  const cookie = cookieHeader(await post(harness(bypassAuth), '/signin'))
  expect(cookie).toContain(`${IMPERSONATE_COOKIE}=`)
  return cookie
}

describe('bypassAuth', () => {
  it('Cookie が無ければ Dev User になる', async () => {
    expect(await whoami(harness(bypassAuth), '')).toEqual({ user: DEV_USER })
  })

  it('signIn した後は impersonate Cookie でそのユーザになる', async () => {
    const app = harness(bypassAuth)
    expect(await whoami(app, await impersonateCookie())).toEqual({ user: alice })
  })

  it('署名が壊れた Cookie は無視して Dev User に戻る', async () => {
    const app = harness(bypassAuth)
    expect(await whoami(app, `${IMPERSONATE_COOKIE}=alice.forged-signature`)).toEqual({ user: DEV_USER })
  })

  it('signOut すると未ログインになり、signIn で戻れる', async () => {
    const app = harness(bypassAuth)
    const signedOut = cookieHeader(await post(app, '/signout', await impersonateCookie()))
    expect(await whoami(app, signedOut)).toEqual({ user: null })

    const signedIn = cookieHeader(await post(app, '/signin', signedOut))
    expect(await whoami(app, signedIn)).toEqual({ user: alice })
  })
})

describe('sessionAuth', () => {
  it('impersonate Cookie を完全に無視する', async () => {
    const cookie = await impersonateCookie()
    expect(await whoami(harness(sessionAuth()), cookie)).toEqual({ user: null })
  })

  it('signIn → resolve → signOut が一巡する', async () => {
    const app = harness(sessionAuth())
    const cookie = cookieHeader(await post(app, '/signin'))
    expect(cookie).toMatch(/^session=/)
    expect(await whoami(app, cookie)).toEqual({ user: alice })

    await post(app, '/signout', cookie)
    expect(await whoami(app, cookie)).toEqual({ user: null })
  })

  it('署名が壊れたセッション Cookie は未ログイン扱い', async () => {
    expect(await whoami(harness(sessionAuth()), 'session=xxx.forged')).toEqual({ user: null })
  })
})

describe('authFromEnv（本番/バイパスの選択）', () => {
  it('バイパス無効なら impersonate Cookie を渡しても未ログイン', async () => {
    const cookie = await impersonateCookie()
    const app = harness(authFromEnv())
    expect(await whoami(app, cookie)).toEqual({ user: null })
    expect(await whoami(app, cookie, { DEV_BYPASS_AUTH: '0' })).toEqual({ user: null })
  })

  it('DEV_BYPASS_AUTH / BYPASS_AUTH が真のときだけバイパスされる', async () => {
    const app = harness(authFromEnv())
    expect(await whoami(app, '', { DEV_BYPASS_AUTH: '1' })).toEqual({ user: DEV_USER })
    expect(await whoami(app, '', { BYPASS_AUTH: 'true' })).toEqual({ user: DEV_USER })
    expect(await whoami(app, '')).toEqual({ user: null })
  })
})
