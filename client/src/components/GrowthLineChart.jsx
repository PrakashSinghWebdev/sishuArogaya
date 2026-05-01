import { useMemo } from 'react';

// WHO reference growth standards (0-24 months)
const WHO_WEIGHT = [
  3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.1, 10.3, 10.4, 10.6,
  10.7, 10.8, 10.9, 11.0, 11.1, 11.2
];

const WHO_HEIGHT = [
  49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3,
  83.2, 84.1, 84.9, 85.7, 86.5, 87.2
];

const WHO_HEAD = [
  35.5, 38.1, 40.2, 41.8, 43.1, 43.9, 44.6, 45.2, 45.7, 46.1, 46.5, 46.8, 47.1, 47.4, 47.6, 47.9, 48.1, 48.3, 48.5,
  48.6, 48.8, 48.9, 49.1, 49.2, 49.3
];

/**
 * GrowthLineChart - Displays baby growth with WHO reference
 * Shows:
 * - Yellow dashed line: WHO standard (expected normal growth)
 * - Green solid line: Baby's growth (if healthy/good)
 * - Red solid line: Baby's growth (if concerning/poor)
 */
export default function GrowthLineChart({ data = [], type = 'weight', maxAge = 24 }) {
  const WHO_DATA = type === 'weight' ? WHO_WEIGHT : type === 'height' ? WHO_HEIGHT : WHO_HEAD;
  const UNIT = type === 'weight' ? 'kg' : 'cm';
  const LABEL = type === 'weight' ? 'Weight' : type === 'height' ? 'Height' : 'Head Circumference';

  // Evaluate if baby's growth is healthy
  const isHealthyGrowth = useMemo(() => {
    if (data.length < 2) return true;
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const ageMonths = latest.ageMonths || 0;
    const whoValue = WHO_DATA[Math.min(Math.floor(ageMonths), WHO_DATA.length - 1)] || 0;

    // If actual is within 85-115% of WHO standard, it's healthy
    const minHealthy = whoValue * 0.85;
    const maxHealthy = whoValue * 1.15;
    const actual = Number(latest[type === 'weight' ? 'weight' : type === 'height' ? 'height' : 'headCircumference'] || 0);

    return actual >= minHealthy && actual <= maxHealthy;
  }, [data, type, WHO_DATA]);

  // Chart dimensions
  const width = 600;
  const height = 350;
  const padding = { top: 30, right: 40, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max for scaling
  const allValues = [
    ...WHO_DATA.slice(0, Math.min(maxAge + 1, WHO_DATA.length)),
    ...data.map(d => Number(d[type === 'weight' ? 'weight' : type === 'height' ? 'height' : 'headCircumference'] || 0))
  ].filter(v => v > 0);

  const minValue = Math.min(...allValues) * 0.85;
  const maxValue = Math.max(...allValues) * 1.1;
  const range = maxValue - minValue;

  // Helper to convert data to SVG coordinates
  const toX = (ageMonths) => padding.left + (ageMonths / maxAge) * chartWidth;
  const toY = (value) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  // Generate SVG path for WHO reference line (dashed, yellow)
  const whoPath = Array.from({ length: Math.min(maxAge + 1, WHO_DATA.length) })
    .map((_, i) => {
      const x = toX(i);
      const y = toY(WHO_DATA[i]);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate SVG path for baby's data (solid, green or red)
  const babyPath = data
    .map((d, i) => {
      const x = toX(d.ageMonths || 0);
      const value = Number(d[type === 'weight' ? 'weight' : type === 'height' ? 'height' : 'headCircumference'] || 0);
      const y = toY(value);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const lineColor = isHealthyGrowth ? '#10b981' : '#ef4444'; // Green or Red

  // Format value display
  const formatValue = (v) => typeof v === 'number' ? v.toFixed(1) : v;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", animation: 'fadeUp .4s ease' }}>
      {/* Title */}
      <div style={{
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h3 style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            color: '#0c2340',
            marginBottom: 4,
          }}>
            📊 {LABEL} Growth Tracker
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: '#4a7a8a' }}>
            Age: {data.length > 0 ? `${data[data.length - 1].ageMonths || 0} months` : 'No data yet'}
          </p>
        </div>

        {/* Status Badge */}
        <div style={{
          padding: '8px 16px',
          borderRadius: 20,
          fontWeight: 700,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isHealthyGrowth ? '#ecfdf5' : '#fef2f2',
          color: isHealthyGrowth ? '#047857' : '#991b1b',
          border: `2px solid ${isHealthyGrowth ? '#10b981' : '#ef4444'}`,
        }}>
          <span style={{ fontSize: 16 }}>{isHealthyGrowth ? '✅' : '⚠️'}</span>
          {isHealthyGrowth ? 'Healthy Growth' : 'Needs Attention'}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30,
            height: 3,
            background: '#f59e0b',
            borderRadius: 2,
            borderTop: '2px dashed #f59e0b',
          }} />
          <span style={{ fontSize: 13, color: '#4a7a8a', fontWeight: 500 }}>WHO Standard (Expected)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30,
            height: 3,
            background: lineColor,
            borderRadius: 2,
          }} />
          <span style={{ fontSize: 13, color: '#4a7a8a', fontWeight: 500 }}>
            Your Baby {isHealthyGrowth ? '(Good ✓)' : '(Alert ⚠)'}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #c5e8ef',
        borderRadius: 14,
        padding: 16,
        overflowX: 'auto',
      }}>
        <svg width={width} height={height} style={{ minWidth: '100%' }}>
          {/* Background grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={`grid-h-${p}`}
              x1={padding.left}
              y1={padding.top + p * chartHeight}
              x2={width - padding.right}
              y2={padding.top + p * chartHeight}
              stroke="rgba(8,145,178,.08)"
              strokeWidth="1"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={`grid-v-${p}`}
              x1={padding.left + p * chartWidth}
              y1={padding.top}
              x2={padding.left + p * chartWidth}
              y2={height - padding.bottom}
              stroke="rgba(8,145,178,.08)"
              strokeWidth="1"
            />
          ))}

          {/* WHO reference line (dashed, yellow) */}
          <path
            d={whoPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="6,4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Baby's growth line (solid, green or red) */}
          {data.length > 0 && (
            <path
              d={babyPath}
              fill="none"
              stroke={lineColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points for baby's growth */}
          {data.map((d, i) => {
            const x = toX(d.ageMonths || 0);
            const value = Number(d[type === 'weight' ? 'weight' : type === 'height' ? 'height' : 'headCircumference'] || 0);
            const y = toY(value);
            const isLatest = i === data.length - 1;

            return (
              <g key={i}>
                {/* Point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isLatest ? 6 : 4}
                  fill={isLatest ? lineColor : '#fff'}
                  stroke={lineColor}
                  strokeWidth="2"
                />
                {/* Value label on latest point */}
                {isLatest && (
                  <text
                    x={x}
                    y={y - 16}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill={lineColor}
                  >
                    {formatValue(value)} {UNIT}
                  </text>
                )}
              </g>
            );
          })}

          {/* Axes */}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#0c2340" strokeWidth="2" />
          <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#0c2340" strokeWidth="2" />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <g key={`y-label-${p}`}>
              <text
                x={padding.left - 10}
                y={padding.top + (1 - p) * chartHeight + 4}
                textAnchor="end"
                fontSize="11"
                fill="#4a7a8a"
              >
                {formatValue(minValue + p * range)} {UNIT}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {[0, 6, 12, 18, 24].filter(m => m <= maxAge).map((m) => (
            <g key={`x-label-${m}`}>
              <text
                x={toX(m)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#4a7a8a"
              >
                {m}m
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text x={padding.left - 30} y={padding.top - 10} fontSize="12" fontWeight="700" fill="#0c2340">
            {UNIT}
          </text>
          <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0c2340">
            Age (Months)
          </text>
        </svg>
      </div>

      {/* Health Indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 14,
        marginTop: 20,
      }}>
        {/* Latest Value */}
        {data.length > 0 && (
          <div style={{
            padding: 14,
            background: '#f0fdff',
            border: '1.5px solid #c5e8ef',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7a8a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              Latest {LABEL}
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#0891b2',
              fontFamily: "'Libre Baskerville', serif",
            }}>
              {formatValue(data[data.length - 1][type === 'weight' ? 'weight' : type === 'height' ? 'height' : 'headCircumference'])} <span style={{ fontSize: 14 }}>{UNIT}</span>
            </div>
            <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 4 }}>
              Age: {data[data.length - 1].ageMonths || 0} months
            </div>
          </div>
        )}

        {/* WHO Expected */}
        {data.length > 0 && (
          <div style={{
            padding: 14,
            background: '#fffbeb',
            border: '1.5px solid #fcd34d',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              WHO Expected
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#f59e0b',
              fontFamily: "'Libre Baskerville', serif",
            }}>
              {formatValue(WHO_DATA[Math.min(Math.floor(data[data.length - 1].ageMonths || 0), WHO_DATA.length - 1)])} <span style={{ fontSize: 14 }}>{UNIT}</span>
            </div>
            <div style={{ fontSize: 11, color: '#92400e', marginTop: 4 }}>
              For normal growth
            </div>
          </div>
        )}

        {/* Status */}
        <div style={{
          padding: 14,
          background: isHealthyGrowth ? '#ecfdf5' : '#fef2f2',
          border: `1.5px solid ${isHealthyGrowth ? '#10b981' : '#fca5a5'}`,
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: isHealthyGrowth ? '#047857' : '#991b1b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
            Growth Status
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: isHealthyGrowth ? '#10b981' : '#ef4444',
            marginBottom: 4,
          }}>
            {isHealthyGrowth ? '✅ On Track' : '⚠️ Review Needed'}
          </div>
          <div style={{ fontSize: 11, color: isHealthyGrowth ? '#047857' : '#991b1b' }}>
            {isHealthyGrowth
              ? 'Baby is growing within healthy range'
              : 'Consider consulting a doctor'
            }
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {!isHealthyGrowth && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: '#fff1f2',
          border: '1.5px solid #fca5a5',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>🏥</span> Doctor Consultation Recommended
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>
            <li>Get your baby's health checked by a pediatrician</li>
            <li>Ensure proper nutrition and feeding schedule</li>
            <li>Track growth regularly (monthly preferred)</li>
            <li>Follow doctor's advice for supplements if needed</li>
          </ul>
        </div>
      )}

      {/* No Data Message */}
      {data.length === 0 && (
        <div style={{
          marginTop: 20,
          padding: 20,
          background: '#f0f9ff',
          border: '1.5px dashed #0891b2',
          borderRadius: 12,
          textAlign: 'center',
          color: '#4a7a8a',
        }}>
          📊 No growth data yet. Start tracking by adding measurements!
        </div>
      )}
    </div>
  );
}
