type Props = {
  cols: number
  rows?: number
}

export function SkeletonRow({ cols, rows = 5 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div className="h-4 bg-gray-200 animate-pulse rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
