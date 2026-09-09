import { Hono } from 'hono'
import type { AuthProvider } from '../auth'
import { envFlag } from '../auth/cookie'
import type { Bindings, Env } from '../env'
import { createScenarioUser, findScenario, scenarios } from './definitions'

export function isScenariosEnabled(env: Bindings): boolean {
  return envFlag(env.SCENARIOS_ENABLED)
}

/**
 * `/__scenarios` 配下のルート。createApp から `app.route('/__scenarios', scenarioRoutes(auth))` で載せる。
 *
 * - GET /__scenarios                 一覧ページ
 * - GET /__scenarios/:name           使い捨てユーザで signIn → 状態を作る → 303 で画面へ
 * - GET /__scenarios/:name?format=json  リダイレクトせず、作ったユーザと状態を JSON で返す
 *
 * SCENARIOS_ENABLED が真のときだけ応答し、それ以外は 404。
 * ログインは auth.signIn を呼ぶだけで、Cookie やミドルウェアには触らない。
 */
export function scenarioRoutes(auth: AuthProvider) {
  return new Hono<Env>()
    .use(async (c, next) => {
      if (!isScenariosEnabled(c.env)) return c.notFound()
      await next()
    })
    .get('/', (c) =>
      c.render('Scenarios/Index', {
        scenarios: scenarios.map(({ name, description }) => ({
          name,
          description,
          url: `/__scenarios/${name}`,
        })),
      })
    )
    .get('/:name', async (c) => {
      const scenario = findScenario(c.req.param('name'))
      if (!scenario) return c.notFound()

      const user = createScenarioUser(scenario.name)
      const result = scenario.seed(user)
      await auth.signIn(c, user)

      if (c.req.query('format') === 'json') {
        return c.json({ scenario: scenario.name, user, ...result })
      }
      return c.redirect(result.redirect, 303)
    })
}
