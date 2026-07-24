import { useForm } from '@inertiajs/react'
import { Layout } from '../../components/Layout'
import { NoteForm } from '../../components/NoteForm'
import type { PageProps } from '../../pages.gen'

export default function NoteNew({ values, errors }: PageProps<'Notes/New'>) {
  // useForm がフォームの状態と送信中フラグを持つ。
  // errors は props（server.ts がバリデーション失敗時に返したもの）を使う。
  const { data, setData, post, processing } = useForm(values)

  return (
    <Layout title="新規ノート">
      <h1 className="mb-6 text-2xl font-bold">新規ノート</h1>
      <NoteForm
        data={data}
        setData={setData}
        errors={errors}
        processing={processing}
        onSubmit={() => post('/notes')}
        submitLabel="作成"
        cancelHref="/notes"
      />
    </Layout>
  )
}
