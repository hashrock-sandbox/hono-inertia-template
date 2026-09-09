import type { SessionUser } from '../auth'
import { clearNotes, createNote } from '../notes'

/**
 * UI テスト用シナリオ。「使い捨てユーザでログインし、決まった状態を作り、画面へ飛ばす」を
 * 1 つの GET で済ませる。ブラウザテストは `/__scenarios/<name>` を開くだけでよい。
 */
export type Scenario = {
  name: string
  description: string
  /** 状態を作り、遷移先と何を作ったかを返す。認証は呼び出し側が auth.signIn で行う。 */
  seed(user: SessionUser): ScenarioResult
}

export type ScenarioResult = {
  redirect: string
  seeded: Record<string, number>
}

/** シナリオごとに使い捨てユーザを作る。id は毎回変え、表示名は固定にする。 */
export function createScenarioUser(scenario: string): SessionUser {
  const suffix = crypto.randomUUID().slice(0, 8)
  return {
    id: `scenario-${scenario}-${suffix}`,
    name: `Scenario ${scenario}`,
    email: `scenario-${scenario}@example.com`,
  }
}

export const scenarios: Scenario[] = [
  {
    name: 'empty',
    description: 'ノートが 0 件の一覧（空状態の表示）',
    seed() {
      clearNotes()
      return { redirect: '/notes', seeded: { notes: 0 } }
    },
  },
  {
    name: 'typical',
    description: 'ノートが 3 件ある一覧（典型状態）',
    seed(user) {
      clearNotes()
      const samples = [
        { title: '買い物リスト', body: '牛乳\n卵\nパン' },
        { title: '会議メモ', body: `${user.name} が担当。来週までにドラフトを出す。` },
        { title: '無題 3', body: '' },
      ]
      // id と時刻を固定して「更新: …」の表示と並び順を決定的にする。
      const notes = samples.map((input, i) =>
        createNote(input, { id: `scenario-note-${i + 1}`, now: `2026-01-0${i + 1}T00:00:00.000Z` })
      )
      return { redirect: '/notes', seeded: { notes: notes.length } }
    },
  },
]
