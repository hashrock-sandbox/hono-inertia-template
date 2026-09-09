import { Layout } from '../../components/Layout'
import type { PageProps } from '../../pages.gen'

/**
 * UI テスト用シナリオの一覧。各リンクは使い捨てユーザでログインして状態を作り、
 * 対象画面へ 303 で飛ぶ。Cookie を書くので Inertia の <Link> ではなく素の <a> で全ページ遷移する。
 */
export default function ScenariosIndex({ scenarios }: PageProps<'Scenarios/Index'>) {
  return (
    <Layout title="Scenarios">
      <h1 className="text-2xl font-bold">UI テスト用シナリオ</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCENARIOS_ENABLED が有効なときだけ表示されます。<code className="font-mono">?format=json</code>{' '}
        を付けると遷移せずに結果を返します。
      </p>
      <ul className="mt-8 divide-y divide-neutral-200 dark:divide-neutral-800">
        {scenarios.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-4 py-4">
            <div>
              <a href={s.url} className="font-mono font-medium hover:underline">
                {s.name}
              </a>
              <div className="mt-1 text-sm text-neutral-500">{s.description}</div>
            </div>
            <a
              href={`${s.url}?format=json`}
              className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-900 dark:border-neutral-700 dark:hover:border-white"
            >
              JSON
            </a>
          </li>
        ))}
      </ul>
    </Layout>
  )
}
