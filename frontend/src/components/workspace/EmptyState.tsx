import { FileText } from 'lucide-react'

type Props = {
  title: string
  description: string
}

export function EmptyState({ title, description }: Props) {
  return (
    <section className="empty-state">
      <FileText size={42} />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}
