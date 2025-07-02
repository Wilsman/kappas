export const TRADER_COLORS = {
  'Prapor': '#ef4444',
  'Therapist': '#22c55e', 
  'Skier': '#3b82f6',
  'Peacekeeper': '#f59e0b',
  'Mechanic': '#8b5cf6',
  'Ragman': '#ec4899',
  'Jaeger': '#10b981',
  'Fence': '#6b7280',
  'Lightkeeper': '#f97316',
  'Ref': '#06b6d4',
  'BTR Driver': '#a1a1aa' // Added based on usage in App.tsx
} as const;

export type TraderName = keyof typeof TRADER_COLORS;
