interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  // Use 75% of the circle for the arc (270 degrees)
  const arcLength = circumference * 0.75;
  const progress = (clampedScore / 100) * arcLength;

  function getColor(s: number) {
    if (s < 50) return { stroke: '#ef4444', text: 'text-red-400', label: 'Needs Improvement', bg: 'from-red-500/20 to-red-600/5' };
    if (s < 75) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'Good', bg: 'from-amber-500/20 to-amber-600/5' };
    return { stroke: '#8b5cf6', text: 'text-violet-400', label: 'Excellent', bg: 'from-violet-500/20 to-fuchsia-600/5' };
  }

  const color = getColor(clampedScore);
  const size = 200;
  const center = size / 2;
  // Start at 135deg (bottom-left), sweep 270deg clockwise
  const startAngle = 135;
  const endAngle = startAngle + 270;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  }

  function describeArc(start: number, end: number) {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const progressAngle = startAngle + (clampedScore / 100) * 270;

  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-gradient-to-b ${color.bg} rounded-3xl p-8 border border-slate-800`}
      aria-label={`ATS Score: ${clampedScore} out of 100`}
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Track */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress */}
        {clampedScore > 0 && (
          <path
            d={describeArc(startAngle, progressAngle)}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color.stroke}88)` }}
          />
        )}
        {/* Center text */}
        <text x={center} y={center - 8} textAnchor="middle" fill="white" fontSize="42" fontWeight="800" fontFamily="Inter, sans-serif">
          {clampedScore}
        </text>
        <text x={center} y={center + 18} textAnchor="middle" fill="#64748b" fontSize="14" fontFamily="Inter, sans-serif">
          out of 100
        </text>
      </svg>

      <p className={`text-lg font-bold mt-1 ${color.text}`}>{color.label}</p>
    </div>
  );
}
