import { describe, expect, it } from 'vitest'
import { bypassAuth, DEV_USER, type AuthProvider, type SessionUser } from '../auth'
import { listNotes } from '../notes'
import { createApp } from '../server'

const enabled = { SCENARIOS_ENABLED: '1' }

/** signIn で渡されたユーザを記録する provider。Cookie の実装には依存しない。 */
function recordingAuth() {
  const signedIn: SessionUser[] = []
  const auth: AuthProvider = {
    resolve: async () => DEV_USER,
    signIn: async (_c, user) => {
      signedIn.push(user)
    },
    signOut: async () => {},
  }
  return { auth, signedIn }
}

describe('/__scenarios', () => {
  it('SCENARIOS_ENABLED が無ければ 404', async () => {
    const app = createApp({ auth: recordingAuth().auth })
    expect((await app.request('/__scenarios', {}, {})).status).toBe(404)
    expect((await app.request('/__scenarios/empty', {}, {})).status).toBe(404)
  })

  it('一覧ページに empty / typical が載る', async () => {
    const app = createApp({ auth: recordingAuth().auth })
    const res = await app.request('/__scenarios', { headers: { 'X-Inertia': 'true' } }, enabled)
    expect(res.status).toBe(200)
    const page = (await res.json()) as { component: string; props: { scenarios: { name: string }[] } }
    expect(page.component).toBe('Scenarios/Index')
    expect(page.props.scenarios.map((s) => s.name)).toEqual(['empty', 'typical'])
  })

  it('使い捨てユーザで auth.signIn を呼び、303 で画面へ飛ばす', async () => {
    const { auth, signedIn } = recordingAuth()
    const res = await createApp({ auth }).request('/__scenarios/typical', {}, enabled)
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/notes')
    expect(signedIn).toHaveLength(1)
    expect(signedIn[0].id).toMatch(/^scenario-typical-/)
    expect(listNotes()).toHaveLength(3)
  })

  it('?format=json はリダイレクトせず結果を返す', async () => {
    const res = await createApp({ auth: recordingAuth().auth }).request(
      '/__scenarios/empty?format=json',
      {},
      enabled
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      scenario: 'empty',
      redirect: '/notes',
      seeded: { notes: 0 },
      user: { name: 'Scenario empty' },
    })
    expect(listNotes()).toHaveLength(0)
  })

  it('bypassAuth と組むと impersonate Cookie が書かれる', async () => {
    const res = await createApp({ auth: bypassAuth() }).request('/__scenarios/typical', {}, enabled)
    expect(res.headers.getSetCookie().join()).toMatch(/impersonate=scenario-typical-/)
  })

  it('知らない名前は 404', async () => {
    const res = await createApp({ auth: recordingAuth().auth }).request('/__scenarios/nope', {}, enabled)
    expect(res.status).toBe(404)
  })
})
