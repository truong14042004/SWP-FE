import { cn } from '@/lib/utils';
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number';

/**
 * KPI strip — 1-fr columns with hairline dividers.
 * Cells: { label, value (number | string), hint? }
 */
export function WorkspaceKpiStrip({ cells, className }) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 md:grid-cols-4',
        className,
      )}
    >
      {cells.map((cell, idx) => (
        <li
          key={idx}
          className="flex flex-col gap-1 bg-white px-6 py-7"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {cell.label}
          </span>
          <span className="font-sans text-[40px] font-semibold leading-none tracking-tight text-neutral-900 tabular-nums">
            {typeof cell.value === 'number' ? (
              <CountingNumber number={cell.value} />
            ) : (
              cell.value
            )}
          </span>
          {cell.hint && (
            <span className="text-xs text-neutral-500">{cell.hint}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
