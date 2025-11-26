import { memo } from "react";
import { HelpCircle } from "lucide-react";

export interface UnknownZoneData {
  width: number;
  height: number;
}

function UnknownZone({ data }: { data: UnknownZoneData }) {
  return (
    <div
      className="pointer-events-none select-none"
      style={{
        width: data.width,
        height: data.height,
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            rgba(168, 85, 247, 0.03) 5%,
            rgba(168, 85, 247, 0.08) 20%,
            rgba(168, 85, 247, 0.12) 100%
          )`,
          border: "2px dashed rgba(168, 85, 247, 0.3)",
          borderTop: "3px dashed rgba(168, 85, 247, 0.5)",
        }}
      />
      {/* Label at top of zone */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/40 backdrop-blur-sm">
        <HelpCircle className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-medium text-purple-300">
          Unconfirmed Territory — Paths Below Not Yet Verified
        </span>
        <HelpCircle className="h-4 w-4 text-purple-400" />
      </div>
      {/* Fog/haze pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 60%, rgba(168, 85, 247, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 90%, rgba(168, 85, 247, 0.2) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  );
}

export default memo(UnknownZone);
