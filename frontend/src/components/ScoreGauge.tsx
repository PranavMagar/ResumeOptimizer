interface ScoreGaugeProps {
  score: number;
}

/**
 * ScoreGauge — displays the ATS score as a circular arc gauge with color coding.
 *
 * Color bands (Requirement 8.3, Design Property 17):
 *   - Red:    score < 50
 *   - Yellow: score 50–74
 *   - Green:  score ≥ 75
 *
 * Accessibility: aria-label with numeric value for screen readers.
 */
export function ScoreGauge({ score }: ScoreGaugeProps) {
  // Clamp score to [0, 100] for safety
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Determine color band
  function getColorClass(s: number): string {
    if (s < 50) return 'score-gauge--red';
    if (s < 75) return 'score-gauge--yellow';
    return 'score-gauge--green';
  }

  function getColorLabel(s: number): string {
    if (s < 50) return 'Needs improvement';
    if (s < 75) return 'Good';
    return 'Excellent';
  }

  // SVG arc gauge parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (clampedScore / 100) * circumference;
  const colorClass = getColorClass(clampedScore);

  return (
    <div
      className={`score-gauge ${colorClass}`}
      aria-label={`ATS Score: ${clampedScore} out of 100`}
      role="img"
    >
      <svg
        className="score-gauge__svg"
        viewBox="0 0 120 120"
        aria-hidden="true"
        width="120"
        height="120"
      >
        {/* Background track */}
        <circle
          className="score-gauge__track"
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          className="score-gauge__progress"
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>

      {/* Numeric display */}
      <div className="score-gauge__label">
        <span className="score-gauge__number">{clampedScore}</span>
        <span className="score-gauge__max">/100</span>
      </div>

      <p className="score-gauge__status">{getColorLabel(clampedScore)}</p>
    </div>
  );
}
