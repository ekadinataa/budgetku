import { fmt } from '../../utils/formatters';

/**
 * CompareBarChart — Vertical bar chart comparing income, expense, and previous expense.
 *
 * Renders three vertical bars in an SVG with proper padding so value labels
 * never escape the SVG bounds.
 *
 * @param {Object} props
 * @param {{ label: string, value: number, color: string }} props.a - First bar (income)
 * @param {{ label: string, value: number, color: string }} props.b - Second bar (expense)
 * @param {{ label: string, value: number, color: string }} props.prev - Third bar (previous)
 *
 * Requirements: 7.3
 */
export default function CompareBarChart({ a, b, prev }) {
  const max = Math.max(a.value, b.value, prev.value, 1);
  const W = 320;
  const H = 220;
  const padTop = 32;
  const padBot = 32;
  const barH = H - padTop - padBot;

  const bars = [
    { label: a.label, value: a.value, color: a.color, dim: false },
    { label: b.label, value: b.value, color: b.color, dim: false },
    { label: prev.label, value: prev.value, color: prev.color, dim: true },
  ];

  const bw = 52;
  const gap = 24;
  const totalBarsWidth = bars.length * bw + (bars.length - 1) * gap;
  const startX = (W - totalBarsWidth) / 2;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 240 }}>
      <line x1="0" y1={padTop} x2={W} y2={padTop} stroke="var(--border-2)" strokeWidth="1" />
      <line x1="0" y1={H - padBot} x2={W} y2={H - padBot} stroke="var(--border)" strokeWidth="1" />
      {bars.map((bar, i) => {
        const bh = Math.max((bar.value / max) * barH, bar.value > 0 ? 4 : 0);
        const x = startX + i * (bw + gap);
        const y = H - padBot - bh;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={bh}
              rx="6"
              fill={bar.color}
              fillOpacity={bar.dim ? 0.45 : 1}
            />
            {bar.value > 0 && (
              <text
                x={x + bw / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={bar.dim ? 'var(--text-5)' : bar.color}
              >
                {fmt(bar.value)}
              </text>
            )}
            <text
              x={x + bw / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-5)"
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
