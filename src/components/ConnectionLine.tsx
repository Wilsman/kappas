import React from "react";

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isCompleted: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  isCompleted,
  isHighlighted = false,
  isDimmed = false,
}) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const getConnectionStyle = () => {
    if (isHighlighted) {
      return {
        height: '3px',
        background: 'hsl(47, 100%, 60%)',
        opacity: 1,
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.7)',
      };
    }
    if (isDimmed) {
      return {
        height: isCompleted ? '2px' : '1px',
        background: isCompleted ? 'hsl(142, 76%, 36%)' : 'hsl(217, 91%, 60%)',
        opacity: 0.2,
        boxShadow: 'none',
      };
    }
    return {
      height: isCompleted ? '3px' : '2px',
      background: isCompleted ? 'hsl(142, 76%, 36%)' : 'hsl(217, 91%, 60%)',
      opacity: isCompleted ? 0.8 : 0.6,
      boxShadow: isCompleted 
        ? '0 0 8px rgba(16, 185, 129, 0.5)' 
        : '0 0 4px rgba(59, 130, 246, 0.3)',
    };
  };

  const connectionStyle = getConnectionStyle();

  return (
    <div
      className="absolute pointer-events-none transition-all duration-200"
      style={{
        left: from.x,
        top: from.y,
        width: length,
        transformOrigin: "0 50%",
        transform: `rotate(${angle}deg)`,
        ...connectionStyle,
      }}
    >
      {/* Arrow head */}
      <div
        className="absolute right-0 top-1/2 transform -translate-y-1/2 transition-all duration-200"
        style={{
          width: 0,
          height: 0,
          borderLeft: isHighlighted ? "10px solid" : "8px solid",
          borderLeftColor: isHighlighted 
            ? 'hsl(47, 100%, 60%)' 
            : isCompleted 
              ? 'hsl(142, 76%, 36%)' 
              : 'hsl(217, 91%, 60%)',
          borderTop: isHighlighted ? "5px solid transparent" : "4px solid transparent",
          borderBottom: isHighlighted ? "5px solid transparent" : "4px solid transparent",
          opacity: isHighlighted ? 1 : (isDimmed ? 0.2 : (isCompleted ? 0.8 : 0.6)),
          filter: isHighlighted 
            ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))'
            : isCompleted 
              ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))' 
              : 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))',
        }}
      />
    </div>
  );
};
