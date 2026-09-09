import { Hono } from 'hono'
import type { AuthProvider } from '../auth'
import { isScenariosEnabled, type Env } from '../env'
import { createScenarioUser, scenarios } from './definitions'

/** マウント先。server.ts の app.route と一覧ページのリンクが同じ値を使う。 */
export const SCENARIOS_BASE = '/__scenarios'

/** 一覧ページに渡す props。シナリオ定義は静的なので 1 回だけ作る。 */
const scenarioList = scenarios.map(({ name, description }) => ({
  name,
  description,
  url: `${SCENARIOS_BASE}/${name}`,
}))

/**
 * `/__scenarios` 配下のルート。createApp から `app.route(SCENARIOS_BASE, scenarioRoutes(auth))` で載せる。
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
    .get('/', (c) => c.render('Scenarios/Index', { scenarios: scenarioList }))
    .get('/:name', async (c) => {
      const scenario = scenarios.find((s) => s.name === c.req.param('name'))
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
