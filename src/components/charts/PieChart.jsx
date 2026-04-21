import { fmt } from '../../utils/formatters';

/**
 * PieChart — Donut pie chart with center total label.
 *
 * Renders an SVG donut chart from an array of slices. Each slice is drawn as
 * an arc segment with a white stroke separator. The center displays the total.
 *
 * @param {Object} props
 * @param {{ label: string, value: number, color: string }[]} props.slices - Data slices
 * @param {number} [props.size=180] - SVG width and height in pixels
 *
 * Requirements: 7.2
 */
export default function PieChart({ slices, size = 180 }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-6)', fontSize: 13 }}>
        Tidak ada data
      </div>
    );
  }

  let angle = -Math.PI / 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const inner = r * 0.55;

  const paths = slices.map((s) => {
    const a = (s.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + a);
    const y2 = cy + r * Math.sin(angle + a);
    const xi1 = cx + inner * Math.cos(angle);
    const yi1 = cy + inner * Math.sin(angle);
    const xi2 = cx + inner * Math.cos(angle + a);
    const yi2 = cy + inner * Math.sin(angle + a);
    const large = a > Math.PI ? 1 : 0;
    const d = `M${xi1},${yi1} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} L${xi2},${yi2} A${inner},${inner},0,${large},0,${xi1},${yi1}Z`;
    angle += a;
    return { d, color: s.color };
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="var(--text-5)">
          Total
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text-1)">
          {fmt(total)}
        </text>
      </svg>
    </div>
  );
}
