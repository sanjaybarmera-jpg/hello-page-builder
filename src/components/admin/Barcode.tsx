import { useMemo } from "react";
import { encodeCode128B } from "@/lib/barcode";

export function Barcode({
  value,
  height = 36,
  className,
}: {
  value: string;
  height?: number;
  className?: string;
}) {
  const { bars, width } = useMemo(() => encodeCode128B(value), [value]);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Barcode ${value}`}
    >
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.width} height={height} fill="#000000" />
      ))}
    </svg>
  );
}
