import { useForm } from '@inertiajs/react'
import { Layout } from '../../components/Layout'
import { NoteForm } from '../../components/NoteForm'
import type { PageProps } from '../../pages.gen'

export default function NoteEdit({ note, values, errors }: PageProps<'Notes/Edit'>) {
  const { data, setData, put, processing } = useForm(values)

  return (
    <Layout title={`${note.title} を編集`}>
      <h1 className="mb-6 text-2xl font-bold">ノートを編集</h1>
      <NoteForm
        data={data}
        setData={setData}
        errors={errors}
        processing={processing}
        onSubmit={() => put(`/notes/${note.id}`)}
        submitLabel="保存"
        cancelHref={`/notes/${note.id}`}
      />
    </Layout>
  )
}
