import { motion } from "framer-motion";

interface RingProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  unit?: string;
  icon?: React.ReactNode;
}

export function RingProgress({
  value,
  max,
  size = 88,
  strokeWidth = 6,
  color = "#6366f1",
  unit,
  icon,
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / Math.max(max, 1), 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-s)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && <div className="mb-0.5 opacity-50">{icon}</div>}
        <span className="text-sm font-bold text-[var(--text-heading)] leading-none">{value}</span>
        {unit && <span className="text-[9px] text-[#444] mt-0.5">{unit}</span>}
      </div>
    </div>
  );
}
