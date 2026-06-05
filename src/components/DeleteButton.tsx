'use client'

type Props = {
  message?: string
  className?: string
  children?: React.ReactNode
}

export default function DeleteButton({
  message = 'Confirma a exclusão?',
  className = 'shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50',
  children = 'Excluir',
}: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => { if (!confirm(message)) e.preventDefault() }}
    >
      {children}
    </button>
  )
}
