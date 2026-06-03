type Props = { score: number; showLabel?: boolean }

export default function ScoreBadge({ score, showLabel = false }: Props) {
  const color =
    score >= 61 ? 'bg-green-100 text-green-700' :
    score >= 31 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}
      {showLabel && <span className="font-normal opacity-70">pts</span>}
    </span>
  )
}
