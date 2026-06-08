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
  iconUrl: string;
  routeNote: string;
  mainRoute: string[];
  requirementHighlights: string[];
  terminalAccessCost?: string;
  playerGuidance: string;
  guidanceTone: "avoid" | "recommended" | "warning" | "grind";
  // Pre-calculated from path data
  totalCraftHours: number;
  totalTimeGateHours: number;
  totalCostRoubles: number;
  totalCostBTC: number;
  totalCostUSD: number;
  totalSteps: number;
  // Rewards
  rewards: EndingReward[];
  // Node IDs for this ending (can have multiple paths)
  endingNodeIds: string[];
  // Key decisions required
  keyDecisions: string[];
  // Achievements unlocked on this path
  achievements: string[];
}

// Ending node IDs from storylineMapData
const ENDING_NODE_IDS = {
  survivor: ["survivor-ending"],
  savior: ["savior-ending"],
  fallen: ["fallen-ending"],
  debtor: ["debtor-ending"],
};

const ENDING_LAYOUT_X_GAP = 360;
const ENDING_LAYOUT_Y_GAP = 128;

const ENDING_ROUTE_BRANCH_TARGETS: Record<string, string[]> = {
  survivor: ["survivor-ending", "lk-case", "sl-300", "sl-48"],
  savior: ["savior-ending", "lk-case", "coop", "kill-5-no-scav"],
  fallen: ["fallen-ending", "lk-case", "military-50"],
  debtor: ["debtor-ending", "lk-case"],
};

function getUniqueNodesById(nodeLists: Node[][]): Node[] {
  const nodeIds = new Set<string>();
  const nodes: Node[] = [];

  for (const nodeList of nodeLists) {
    for (const node of nodeList) {
      if (nodeIds.has(node.id)) continue;

      nodeIds.add(node.id);
      nodes.push(node);
    }
  }

  return nodes;
}

function getEndingRoutePathNodes(endingId: string, endingNodeId: string) {
  const targetIds = ENDING_ROUTE_BRANCH_TARGETS[endingId] ?? [endingNodeId];

  return getUniqueNodesById(
    targetIds.map((targetId) =>
      findPathToNode(targetId, initialNodes, initialEdges),
    ),
  );
}

function calculateEndingNodeDepths(pathNodes: Node[], pathEdges: Edge[]) {
  const incomingCount = new Map<string, number>();
  const outgoing = new Map<string, Edge[]>();
  const nodesById = new Map(pathNodes.map((node) => [node.id, node]));

  pathNodes.forEach((node) => {
    incomingCount.set(node.id, 0);
    outgoing.set(node.id, []);
  });

  pathEdges.forEach((edge) => {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge);
  });

  const sortIdsByOriginalPosition = (leftId: string, rightId: string) => {
    const leftPosition = nodesById.get(leftId)?.position ?? { x: 0, y: 0 };
    const rightPosition = nodesById.get(rightId)?.position ?? { x: 0, y: 0 };

    if (leftPosition.y !== rightPosition.y) {
      return leftPosition.y - rightPosition.y;
    }

    return leftPosition.x - rightPosition.x;
  };

  outgoing.forEach((edges) => {
    edges.sort((left, right) =>
      sortIdsByOriginalPosition(left.target, right.target),
    );
  });

  const queue = [...pathNodes]
    .filter((node) => (incomingCount.get(node.id) ?? 0) === 0)
    .sort((left, right) => sortIdsByOriginalPosition(left.id, right.id));

  const depths = new Map<string, number>();
  queue.forEach((node) => depths.set(node.id, 0));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const currentDepth = depths.get(current.id) ?? 0;

    for (const edge of outgoing.get(current.id) ?? []) {
      const nextDepth = currentDepth + 1;
      depths.set(
        edge.target,
        Math.max(depths.get(edge.target) ?? 0, nextDepth),
      );

      const remainingIncoming = (incomingCount.get(edge.target) ?? 1) - 1;
      incomingCount.set(edge.target, remainingIncoming);

      if (remainingIncoming === 0) {
        const nextNode = nodesById.get(edge.target);
        if (nextNode) {
          queue.push(nextNode);
        }
      }
    }
  }

  return depths;
}

function compactEndingPathNodes(pathNodes: Node[], pathEdges: Edge[]): Node[] {
  const depths = calculateEndingNodeDepths(pathNodes, pathEdges);
  const parentIds = new Map<string, string[]>();
  const assignedX = new Map<string, number>();
  const nodesById = new Map(pathNodes.map((node) => [node.id, node]));
  const nodesByDepth = new Map<number, Node[]>();

  for (const edge of pathEdges) {
    const parents = parentIds.get(edge.target) ?? [];
    parents.push(edge.source);
    parentIds.set(edge.target, parents);
  }

  for (const node of pathNodes) {
    const depth = depths.get(node.id) ?? 0;
    const nodesAtDepth = nodesByDepth.get(depth) ?? [];
    nodesAtDepth.push(node);
    nodesByDepth.set(depth, nodesAtDepth);
  }

  const depthLevels = [...nodesByDepth.keys()].sort((a, b) => a - b);

  for (const depth of depthLevels) {
    const nodesAtDepth = nodesByDepth.get(depth) ?? [];

    nodesAtDepth.sort((left, right) => {
      const leftParents = parentIds.get(left.id) ?? [];
      const rightParents = parentIds.get(right.id) ?? [];

      const getAverageParentX = (parents: string[], fallbackX: number) => {
        const parentXs = parents
          .map((parentId) => assignedX.get(parentId))
          .filter((value): value is number => value !== undefined);

        if (parentXs.length === 0) {
          return fallbackX;
        }

        return (
          parentXs.reduce((sum, value) => sum + value, 0) / parentXs.length
        );
      };

      const leftFallback = nodesById.get(left.id)?.position?.x ?? 0;
      const rightFallback = nodesById.get(right.id)?.position?.x ?? 0;
      const leftAnchor = getAverageParentX(leftParents, leftFallback);
      const rightAnchor = getAverageParentX(rightParents, rightFallback);

      if (leftAnchor !== rightAnchor) {
        return leftAnchor - rightAnchor;
      }

      const leftPosition = nodesById.get(left.id)?.position ?? { x: 0, y: 0 };
      const rightPosition = nodesById.get(right.id)?.position ?? { x: 0, y: 0 };

      if (leftPosition.y !== rightPosition.y) {
        return leftPosition.y - rightPosition.y;
      }

      return leftPosition.x - rightPosition.x;
    });

    nodesAtDepth.forEach((node, index) => {
      const parents = parentIds.get(node.id) ?? [];
      const parentXs = parents
        .map((parentId) => assignedX.get(parentId))
        .filter((value): value is number => value !== undefined);

      if (nodesAtDepth.length === 1 && parentXs.length > 0) {
        assignedX.set(
          node.id,
          parentXs.reduce((sum, value) => sum + value, 0) / parentXs.length,
        );
        return;
      }

      const xCenterOffset =
        ((nodesAtDepth.length - 1) * ENDING_LAYOUT_X_GAP) / 2;
      assignedX.set(node.id, index * ENDING_LAYOUT_X_GAP - xCenterOffset);
    });
  }

  return pathNodes.map((node) => {
    const depth = depths.get(node.id) ?? 0;

    return {
      ...node,
      position: {
        x: assignedX.get(node.id) ?? 0,
        y: depth * ENDING_LAYOUT_Y_GAP,
      },
    };
  });
}

// Calculate stats for a specific ending by finding the shortest path
function calculateEndingStats(endingNodeIds: string[]): {
  totalCraftHours: number;
  totalTimeGateHours: number;
  totalCostRoubles: number;
  totalCostBTC: number;
  totalCostUSD: number;
  totalSteps: number;
} {
  let bestPath = {
    totalCraftHours: Infinity,
    totalTimeGateHours: Infinity,
    totalCostRoubles: Infinity,
    totalCostBTC: Infinity,
    totalCostUSD: Infinity,
    totalSteps: Infinity,
  };

  for (const endingId of endingNodeIds) {
    const pathNodes = findPathToNode(endingId, initialNodes, initialEdges);
    if (pathNodes.length === 0) continue;

    const breakdown = getPathBreakdown(pathNodes);

    // Use the path with lowest total cost as "best"
    const totalCost =
      breakdown.totalCostRoubles +
      breakdown.totalCostBTC * 10000000 +
      breakdown.totalCostUSD * 150; // Rough USD conversion
    const bestTotalCost =
      bestPath.totalCostRoubles +
      bestPath.totalCostBTC * 10000000 +
      bestPath.totalCostUSD * 150;

    if (totalCost < bestTotalCost || bestPath.totalSteps === Infinity) {
      bestPath = {
        totalCraftHours: breakdown.totalCraftHours,
        totalTimeGateHours: breakdown.totalTimeGateHours,
        totalCostRoubles: breakdown.totalCostRoubles,
        totalCostBTC: breakdown.totalCostBTC,
        totalCostUSD: breakdown.totalCostUSD,
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
        totalCostUSD: 0,
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
      "Escape Tarkov by not working with Kerman - the quickest path but costs 300m/500m roubles",
    tagline: "The path of independence",
    color: "#22c55e",
    icon: "🏃",
    iconUrl:
      "https://assets.tarkov.dev/achievement-68e8f02ff3a1196d1a05f2cb-icon.webp",
    routeNote: "500m if you kept the case, 300m if you handed it to Prapor",
    mainRoute: [
      "Keep case (500m) or hand over case (300m)",
      "Don't work with Kerman",
      "Hand over (300m/500m) roubles",
    ],
    requirementHighlights: [
      "Either 300 million or 500 million roubles",
      "5 million roubles to buy Terminal entry each failed attempt",
    ],
    terminalAccessCost:
      "Buy a new Terminal note from Prapor for 5 million roubles each attempt.",
    playerGuidance:
      "Avoid this ending unless you want the easiest route and can pay 300m/500m roubles.",
    guidanceTone: "avoid",
    ...calculateEndingStats(ENDING_NODE_IDS.survivor),
    rewards: [
      { name: "Survivor Armband", icon: "🎗️", description: "Cosmetic only" },
      { name: "Survivor Poster", icon: "🖼️", description: "Commemorative art" },
    ],
    endingNodeIds: ENDING_NODE_IDS.survivor,
    keyDecisions: [
      "Keep or Give Case to Prapor",
      "Don't work with Kerman",
      "Pay Prapor 300M/500M Roubles",
    ],
    achievements: ["Easy Way"],
  },
  {
    id: "savior",
    endingType: "savior",
    label: "Savior",
    description:
      "Escape Tarkov by helping Kerman find all major 8 evidence on Terragroup - requires 4.0 Fence rep and BTR rep",
    tagline: "The path of righteousness",
    color: "#f59e0b",
    icon: "🛡️",
    iconUrl:
      "https://assets.tarkov.dev/achievement-68e8f0575eb7e5ce5000ba0a-icon.webp",
    routeNote:
      "Hand the case to Prapor, unlock Lightkeeper, work with Kerman, then pay 40 BTC, hand over 8x major evidence on Terragroup to Kerman, also requires 4.0 Fence rep",
    mainRoute: [
      "Hand over case to Prapor",
      "Shortcut to Lightkeeper unlock tasks",
      "Work with Kerman",
      "Pay 40 BTC",
      "Hand over 8x major evidence on Terragroup to Kerman",
    ],
    requirementHighlights: [
      "Must complete every other storyline chapter",
      "Requires 4.0 Fence rep and 0.4 BTR rep",
      "Requires Solar Power and final Terminal keycard craft",
    ],
    terminalAccessCost:
      "Each failed Terminal attempt requires crafting the keycard again for 5h 30m, plus a new Blank RFID Card craft that also takes 5h 30m.",
    playerGuidance:
      "Most tasks and rep required, 4.0 Fence Rep, 0.4 BTR Rep and completion of ALL the other storyline chapters.",
    guidanceTone: "recommended",
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
      { name: "1x THICC Item Case", icon: "📦", description: "FIR" },
      { name: "1x THICC Weapon Case", icon: "📦", description: "FIR" },
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
      "Keep or Give Case to Prapor",
      "Work together with Kerman",
      "Help Kerman find Evidence on Terragroup",
      "Complete all story chapters",
      "Get 4.0 Fence rep & 0.4 BTR rep",
    ],
    achievements: [],
  },
  {
    id: "fallen",
    endingType: "fallen",
    label: "Fallen",
    description:
      "Escape Tarkov by refusing to help Kerman after working with him - requires 1M USD and giving up secure container",
    tagline: "The path of betrayal",
    color: "#6b7280",
    icon: "💀",
    iconUrl:
      "https://assets.tarkov.dev/achievement-68e8f042b8efa2bbeb009d89-icon.webp",
    routeNote:
      "Work with Kerman, Pay 40 BTC, then refuse or fail to finish helping him, pay 1M USD",
    mainRoute: [
      "Work with Kerman",
      "Pay 40 BTC",
      "Do not help Kerman find Evidence on Terragroup",
      "Pay Prapor 1M USD",
    ],
    requirementHighlights: [
      "Pay 1,000,000 USD to Prapor",
      "May require giving up a secure container",
      "Not the rouble route, but still extremely expensive",
    ],
    terminalAccessCost:
      "Each failed Terminal attempt requires crafting the keycard again for 5h 30m, plus a new Blank RFID Card craft that also takes 5h 30m.",
    playerGuidance: "This is also a very expensive ending: 1 million USD.",
    guidanceTone: "warning",
    ...calculateEndingStats(ENDING_NODE_IDS.fallen),
    rewards: [
      { name: "10M Roubles", icon: "💰", description: "Cash payout" },
      {
        name: "Money Case",
        icon: "💼",
        description: "Secure currency storage",
      },
    ],
    endingNodeIds: ENDING_NODE_IDS.fallen,
    keyDecisions: [
      "Keep or Give Case to Prapor",
      "Work together with Kerman",
      "Do not help Kerman find Evidence",
      "Hand over 1M USD to Prapor",
    ],
    achievements: ["Enough of your Games!", "Will it Blow?"],
  },
  {
    id: "debtor",
    endingType: "debtor",
    label: "Debtor",
    description:
      "Escape Tarkov by handing over case to Prapor, unlocking Lightkeeper and then helping Kerman - requires visting all marked rooms and 30 PMC kills on woods",
    tagline: "The path of debt",
    color: "#a78bfa",
    icon: "🔮",
    iconUrl:
      "https://assets.tarkov.dev/achievement-68e8f04eb841bc8ac305350a-icon.webp",
    routeNote:
      "Hand over case to Prapor, unlock Lightkeeper,  work with Kerman, hand over 2x evidence on Terragroup to Kerman, then pay 40 BTC",
    mainRoute: [
      "Hand over case to Prapor",
      "Shortcut to Lightkeeper unlock tasks",
      "Work with Kerman",
      "Pay 40 BTC",
      "Hand over 2x evidence on Terragroup to Kerman",
    ],
    requirementHighlights: [
      "Trade 1 Blue Folder with Lightkeeper for a Terminal attempt",
      "Get 30 PMC kills on Woods",
      "Give 100 dogtags to Lightkeeper",
      "Visit every marked room and deliver found amulets",
    ],
    terminalAccessCost:
      "Each failed Terminal attempt costs another Lightkeeper barter for 1 Blue Folder.",
    playerGuidance:
      "30 PMC kills, 100 dogtag hand in, marked room access, and Lightkeeper hand-ins.",
    guidanceTone: "grind",
    ...calculateEndingStats(ENDING_NODE_IDS.debtor),
    rewards: [
      { name: "30,000 EUR", icon: "💶", description: "Cash reward" },
      { name: "4x AP-20 Boxes", icon: "📦", description: "FIR" },
      { name: "10x M993 Boxes", icon: "📦", description: "FIR" },
      { name: "10x Hybrid Boxes", icon: "📦", description: "FIR" },
      { name: "10x AP Boxes", icon: "📦", description: "FIR" },
      { name: "Magazine Case", icon: "📦", description: "FIR" },
      { name: "1x THICC Weapon Case", icon: "📦", description: "FIR" },
      { name: "2x Ammo Case", icon: "📦", description: "FIR" },
      { name: "Money Case", icon: "💰", description: "FIR" },
      { name: "Plates Case", icon: "📦", description: "FIR" },
      { name: "Iskra", icon: "�", description: "FIR" },
      { name: "Hose", icon: "🧴", description: "FIR" },
      { name: "2x RShG-2", icon: "💥", description: "FIR" },
      { name: "Condensed Milk", icon: "🥛", description: "FIR" },
      { name: "3x AA-12", icon: "🔫", description: "FIR" },
      { name: "3x M60E6", icon: "🔫", description: "FIR" },
      { name: "3x SPEAR", icon: "🔫", description: "FIR" },
      { name: "Blue Fuel", icon: "⛽", description: "FIR" },
      { name: "Mr Kerman", icon: "🧔", description: "FIR" },
      { name: "Slickers", icon: "🧴", description: "FIR" },
      { name: "Calok-B", icon: "�", description: "FIR" },
      { name: "Toolbox (Discord Version)", icon: "🧰", description: "FIR" },
      { name: "Targrad poster", icon: "🖼️", description: "FIR" },
      { name: "What You Seek poster", icon: "🖼️", description: "FIR" },
      { name: "3x AXMC", icon: "🔫", description: "FIR" },
      { name: "3x TRG M10", icon: "🔫", description: "FIR" },
    ],
    endingNodeIds: ENDING_NODE_IDS.debtor,
    keyDecisions: [
      "Keep or Give Case to Prapor",
      "Work together with Kerman",
      "Hand 2 Major Evidence to Kerman",
      "Stop working with Kerman",
      "Work with Lightkeeper",
    ],
    achievements: ["U Turn"],
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

  let pathNodes: Node[] = [];

  const endingNodeId = endingInfo.endingNodeIds[0];
  pathNodes = getEndingRoutePathNodes(endingId, endingNodeId);

  const pathNodeIds = new Set(pathNodes.map((n) => n.id));

  // Filter edges to only those in the path
  const pathEdges = initialEdges.filter(
    (e) => pathNodeIds.has(e.source) && pathNodeIds.has(e.target),
  );

  return {
    nodes: compactEndingPathNodes(pathNodes, pathEdges),
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

export function formatUSD(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M USD`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K USD`;
  }
  return `${amount} USD`;
}

export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hoursRemainder = totalMinutes % (24 * 60);
  const remainingHours = Math.floor(hoursRemainder / 60);
  const remainingMinutes = hoursRemainder % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (remainingHours > 0) {
    parts.push(`${remainingHours}h`);
  }

  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes}m`);
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return "0h";
}
