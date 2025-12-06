import type { Node, Edge } from "@xyflow/react";
import {
  initialNodes,
  initialEdges,
  findPathToNode,
  getPathBreakdown,
} from "./storylineMapData";
import type { EndingType } from "./EndingNode";

// ============================================================================
// ENDING METADATA & REWARDS
// ============================================================================

export interface EndingReward {
  name: string;
  icon?: string;
  description?: string;
}

export interface EndingInfo {
  id: string;
  endingType: EndingType;
  label: string;
  description: string;
  tagline: string;
  color: string;
  icon: string;
  // Pre-calculated from path data
  totalCraftHours: number;
  totalTimeGateHours: number;
  totalCostRoubles: number;
  totalCostBTC: number;
  totalSteps: number;
  // Rewards (dummy for now - can be updated later)
  rewards: EndingReward[];
  // Node IDs for this ending (can have multiple paths)
  endingNodeIds: string[];
  // Key decisions required
  keyDecisions: string[];
}

// Ending node IDs from storylineMapData
const ENDING_NODE_IDS = {
  survivor: ["survivor-ending", "survivor-ending-2"],
  savior: ["savior-ending", "savior-ending-2"],
  debtor: ["debtor-ending", "debtor-ending-2"],
  fallen: ["fallen-ending"],
};

// Calculate stats for a specific ending by finding the shortest path
function calculateEndingStats(endingNodeIds: string[]): {
  totalCraftHours: number;
  totalTimeGateHours: number;
  totalCostRoubles: number;
  totalCostBTC: number;
  totalSteps: number;
} {
  let bestPath = {
    totalCraftHours: Infinity,
    totalTimeGateHours: Infinity,
    totalCostRoubles: Infinity,
    totalCostBTC: Infinity,
    totalSteps: Infinity,
  };

  for (const endingId of endingNodeIds) {
    const pathNodes = findPathToNode(endingId, initialNodes, initialEdges);
    if (pathNodes.length === 0) continue;

    const breakdown = getPathBreakdown(pathNodes);

    // Use the path with lowest total cost as "best"
    const totalCost =
      breakdown.totalCostRoubles + breakdown.totalCostBTC * 10000000; // Rough BTC conversion
    const bestTotalCost =
      bestPath.totalCostRoubles + bestPath.totalCostBTC * 10000000;

    if (totalCost < bestTotalCost || bestPath.totalSteps === Infinity) {
      bestPath = {
        totalCraftHours: breakdown.totalCraftHours,
        totalTimeGateHours: breakdown.totalTimeGateHours,
        totalCostRoubles: breakdown.totalCostRoubles,
        totalCostBTC: breakdown.totalCostBTC,
        totalSteps: breakdown.steps.length,
      };
    }
  }

  return bestPath.totalSteps === Infinity
    ? {
        totalCraftHours: 0,
        totalTimeGateHours: 0,
        totalCostRoubles: 0,
        totalCostBTC: 0,
        totalSteps: 0,
      }
    : bestPath;
}

// ============================================================================
// ENDING DEFINITIONS
// ============================================================================

export const endingInfos: EndingInfo[] = [
  {
    id: "survivor",
    endingType: "survivor",
    label: "Survivor",
    description:
      "Escape Tarkov through Prapor's connections. Cost varies: 500M₽ (keep case) or 300M₽ (give case)",
    tagline: "The path of independence",
    color: "#3b82f6",
    icon: "🛡️",
    ...calculateEndingStats(ENDING_NODE_IDS.survivor),
    rewards: [
      { name: "Survivor Trophy", icon: "🏆", description: "Proof of escape" },
      {
        name: "Prapor's Gratitude",
        icon: "🤝",
        description: "Special trader status",
      },
      { name: "500K Roubles", icon: "💰", description: "Escape bonus" },
      // TODO: Replace with actual rewards
    ],
    endingNodeIds: ENDING_NODE_IDS.survivor,
    keyDecisions: [
      "Keep Case (500M₽) or Give Case (300M₽)",
      "Don't work with Kerman",
    ],
  },
  {
    id: "savior",
    endingType: "savior",
    label: "Savior",
    description: "Help Kerman expose Terragroup and escape together",
    tagline: "The path of justice",
    color: "#22c55e",
    icon: "⭐",
    ...calculateEndingStats(ENDING_NODE_IDS.savior),
    rewards: [
      // All items are Found in Raid (FIR) - PvE exclusive reward
      { name: "1x Red Rebel", icon: "⛏️", description: "FIR" },
      { name: "1x Taiga", icon: "🔪", description: "FIR" },
      { name: "4x 12/70 AP-20 Boxes", icon: "📦", description: "FIR" },
      { name: "10x 9x39 BP Boxes", icon: "📦", description: "FIR" },
      { name: "10x 9.3x64 7N33 Boxes", icon: "📦", description: "FIR" },
      { name: "10x .338 LM AP Boxes", icon: "📦", description: "FIR" },
      { name: "18x 40MM M441", icon: "💥", description: "FIR" },
      { name: "18x 40MM M433", icon: "💥", description: "FIR" },
      { name: "10x 7.62x54MMr BS Boxes", icon: "📦", description: "FIR" },
      { name: "1x THICC Case", icon: "📦", description: "FIR" },
      { name: "2x Ammo Cases", icon: "📦", description: "FIR" },
      { name: "1x Mag Case", icon: "📦", description: "FIR" },
      { name: "1x Plate Case", icon: "📦", description: "FIR" },
      { name: "1x Money Case", icon: "💰", description: "FIR" },
      { name: "1x Medicine Case", icon: "💊", description: "FIR" },
      { name: "3x Saiga FA", icon: "🔫", description: "FIR" },
      { name: "3x MSGL", icon: "🔫", description: "FIR" },
      { name: "3x AS VAL MOD 4", icon: "🔫", description: "FIR" },
      { name: "3x TKPD", icon: "🔫", description: "FIR" },
      { name: "3x MK-18 Mjolnir", icon: "🔫", description: "FIR" },
      { name: "3x PKP", icon: "🔫", description: "FIR" },
      { name: "40K USD", icon: "💵", description: "Cash reward" },
    ],
    endingNodeIds: ENDING_NODE_IDS.savior,
    keyDecisions: [
      "Keep or Give Case",
      "Work with Kerman",
      "Help find evidence",
    ],
  },
  {
    id: "debtor",
    endingType: "debtor",
    label: "Debtor",
    description: "Escape through Lightkeeper's network, owing a debt",
    tagline: "The path of obligation",
    color: "#ef4444",
    icon: "⛓️",
    ...calculateEndingStats(ENDING_NODE_IDS.debtor),
    rewards: [
      { name: "Debtor Trophy", icon: "🏆", description: "Freedom at a price" },
      { name: "Lightkeeper's Mark", icon: "🔮", description: "You owe him" },
      { name: "750K Roubles", icon: "💰", description: "Escape bonus" },
      // TODO: Replace with actual rewards
    ],
    endingNodeIds: ENDING_NODE_IDS.debtor,
    keyDecisions: [
      "Keep or Give Case",
      "Work with Kerman",
      "Side with Lightkeeper",
    ],
  },
  {
    id: "fallen",
    endingType: "fallen",
    label: "Fallen",
    description: "Escape through Prapor's hard path, losing everything",
    tagline: "The path of sacrifice",
    color: "#6b7280",
    icon: "💀",
    ...calculateEndingStats(ENDING_NODE_IDS.fallen),
    rewards: [
      {
        name: "Fallen Trophy",
        icon: "🏆",
        description: "Survived at any cost",
      },
      { name: "Empty Pockets", icon: "👛", description: "You gave it all" },
      {
        name: "Bio Weapon Intel",
        icon: "☣️",
        description: "Dangerous knowledge",
      },
      // TODO: Replace with actual rewards
    ],
    endingNodeIds: ENDING_NODE_IDS.fallen,
    keyDecisions: [
      "Keep Case",
      "Work with Kerman",
      "Don't help (no LK access)",
    ],
  },
];

// ============================================================================
// HELPER: Get filtered nodes/edges for a specific ending
// ============================================================================

export function getEndingPathData(endingId: string): {
  nodes: Node[];
  edges: Edge[];
  breakdown: ReturnType<typeof getPathBreakdown>;
} {
  const endingInfo = endingInfos.find((e) => e.id === endingId);
  if (!endingInfo) {
    return { nodes: [], edges: [], breakdown: getPathBreakdown([]) };
  }

  // Get path to first ending node (shortest path)
  const endingNodeId = endingInfo.endingNodeIds[0];
  const pathNodes = findPathToNode(endingNodeId, initialNodes, initialEdges);
  const pathNodeIds = new Set(pathNodes.map((n) => n.id));

  // Filter edges to only those in the path
  const pathEdges = initialEdges.filter(
    (e) => pathNodeIds.has(e.source) && pathNodeIds.has(e.target)
  );

  // Re-position nodes for vertical layout
  const repositionedNodes = pathNodes.map((node, idx) => ({
    ...node,
    position: { x: 0, y: idx * 120 },
  }));

  return {
    nodes: repositionedNodes,
    edges: pathEdges,
    breakdown: getPathBreakdown(pathNodes),
  };
}

// ============================================================================
// HELPER: Format currency
// ============================================================================

export function formatRoubles(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ₽`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)}M ₽`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ₽`;
  }
  return `${amount} ₽`;
}

export function formatHours(hours: number): string {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  return `${hours}h`;
}
