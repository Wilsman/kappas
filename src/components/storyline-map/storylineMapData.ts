import type { Node, Edge } from "@xyflow/react";

// Layout constants for better alignment
const ROW_HEIGHT = 160;
const COL_WIDTH = 320;

// Ending IDs for easy reference
export const ENDING_IDS = [
  "debtor-ending",
  "survivor-ending-300m",
  "survivor-ending-500m",
  "fallen-ending",
  "savior-ending",
] as const;

export type EndingId = (typeof ENDING_IDS)[number];

// Find path from prologue to any target node using BFS
export function findPathToNode(
  targetNodeId: string,
  nodes: Node[],
  edges: Edge[]
): Node[] {
  // Build adjacency list (reverse direction - from target to sources)
  const incomingEdges = new Map<string, string[]>();
  for (const edge of edges) {
    const sources = incomingEdges.get(edge.target) || [];
    sources.push(edge.source);
    incomingEdges.set(edge.target, sources);
  }

  // BFS from target back to prologue
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: string[] = [targetNodeId];
  visited.add(targetNodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === "prologue") break;

    const sources = incomingEdges.get(current) || [];
    for (const source of sources) {
      if (!visited.has(source)) {
        visited.add(source);
        parent.set(source, current);
        queue.push(source);
      }
    }
  }

  // Reconstruct path from prologue to ending
  const path: string[] = [];
  let current: string | undefined = "prologue";
  while (current) {
    path.push(current);
    current = parent.get(current);
  }

  // Convert to nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return path.map((id) => nodeMap.get(id)).filter(Boolean) as Node[];
}

// Alias for backwards compatibility
export const findPathToEnding = findPathToNode;

// Get edge IDs that connect nodes in a path
export function getPathEdgeIds(pathNodes: Node[], edges: Edge[]): Set<string> {
  const pathNodeIds = new Set(pathNodes.map((n) => n.id));
  const edgeIds = new Set<string>();

  for (const edge of edges) {
    if (pathNodeIds.has(edge.source) && pathNodeIds.has(edge.target)) {
      // Check if these nodes are adjacent in the path
      const sourceIdx = pathNodes.findIndex((n) => n.id === edge.source);
      const targetIdx = pathNodes.findIndex((n) => n.id === edge.target);
      if (Math.abs(sourceIdx - targetIdx) === 1) {
        edgeIds.add(edge.id);
      }
    }
  }

  return edgeIds;
}

// Extract breakdown info from a path
export interface PathBreakdown {
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    cost?: number;
    isTimeGate?: boolean;
    timeGateHours?: number;
  }>;
  totalCostRoubles: number;
  totalCostBTC: number;
  totalTimeGateHours: number;
}

export function getPathBreakdown(pathNodes: Node[]): PathBreakdown {
  const steps: PathBreakdown["steps"] = [];
  let totalCostRoubles = 0;
  let totalCostBTC = 0;
  let totalTimeGateHours = 0;

  for (const node of pathNodes) {
    const data = node.data as Record<string, unknown>;
    const label = (data.label as string) || node.id;
    const description = data.description as string | undefined;
    const cost = data.cost as number | undefined;

    // Detect time gates from description
    const timeGateMatch = description?.match(/(\d+)\s*hour/i);
    const isTimeGate = !!timeGateMatch;
    const timeGateHours = timeGateMatch ? parseInt(timeGateMatch[1], 10) : 0;

    if (isTimeGate) {
      totalTimeGateHours += timeGateHours;
    }

    if (cost !== undefined && cost > 0) {
      // BTC costs are < 1000, rouble costs are >= 1000
      if (cost < 1000) {
        totalCostBTC += cost;
      } else {
        totalCostRoubles += cost;
      }
    }

    steps.push({
      id: node.id,
      label,
      description,
      cost,
      isTimeGate,
      timeGateHours: isTimeGate ? timeGateHours : undefined,
    });
  }

  return {
    steps,
    totalCostRoubles,
    totalCostBTC,
    totalTimeGateHours,
  };
}

// Initial nodes based on the Tarkov 1.0 storyline flowchart
// Source: STORYLINE_FLOWCHART.md
export const initialNodes: Node[] = [
  // ============ PROLOGUE: FALLING SKIES ============
  {
    id: "prologue",
    type: "story",
    position: { x: 0, y: -ROW_HEIGHT * 2 },
    data: {
      label: "Prologue: Falling Skies",
      description: "Investigate crash on Woods, retrieve flight recorder & transcripts",
      note: "Requires Prapor LL2",
    },
  },
  {
    id: "retrieve-case",
    type: "story",
    position: { x: 0, y: -ROW_HEIGHT },
    data: {
      label: "Retrieve Armored Case",
      description: "Recover the armored case from plane wreckage on Woods",
    },
  },

  // ============ DECISION 1: ARMORED CASE ============
  {
    id: "start",
    type: "decision",
    position: { x: 0, y: 0 },
    data: {
      label: "Decision 1: The Armored Case",
      description: "Hand over to Prapor or keep it for yourself?",
      isIrreversible: true,
    },
  },

  // ============ PRAPOR'S BRANCH (Left side - Green) ============
  {
    id: "give-prapor",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT },
    data: {
      label: "Hand Over to Prapor",
      description: "₽1M reward, keep Prapor's trust (Recommended)",
      cost: -1000000, // Negative = reward
      isIrreversible: true,
    },
  },
  {
    id: "the-ticket-prapor",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 2 },
    data: {
      label: "The Ticket Quest",
      description: "Build Intel Center 1, wait for Kerman's call",
      note: "Hideout: Intelligence Center Level 1",
    },
  },
  {
    id: "contact-kerman-prapor",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 3 },
    data: {
      label: "Contact Mr. Kerman",
      description: "Establish secure line via hideout intel center",
    },
  },
  {
    id: "investigate-lighthouse",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 4 },
    data: {
      label: "Investigate Lighthouse Camp",
      description: "Search Prapor's camp on Lighthouse for clues",
    },
  },
  {
    id: "unlock-lightkeeper",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 5 },
    data: {
      label: "Unlock Lightkeeper",
      description: "Complete tasks to gain access to Lightkeeper trader",
    },
  },
  {
    id: "recover-case-lk",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 6 },
    data: {
      label: "Recover Case from LK",
      description: "Lightkeeper returns the case contents after his requests",
    },
  },

  // ============ INDEPENDENT BRANCH (Right side - Gray/Purple) ============
  {
    id: "keep-case",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT },
    data: {
      label: "Keep the Case",
      description: "Prapor gets mad: -0.5 rep, ~58 hour unlock",
      isIrreversible: true,
    },
  },
  {
    id: "intel-center-keep",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 1.8 },
    data: {
      label: "Intelligence Center Level 1",
      description: "To contact Mr. Kerman, I need a working laptop",
      note: "Hideout: Intelligence Center Level 1",
    },
  },
  {
    id: "talk-kerman-keep",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 2.65 },
    data: {
      label: "Talk to Mr. Kerman",
      description: "Kerman said to contact him through my Intelligence Center",
    },
  },
  {
    id: "ask-mechanic-help",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 3.3 },
    data: {
      label: "Ask Mechanic for Help",
      description: "Case uses high-grade electronic lock, need special equipment",
    },
  },
  {
    id: "obtain-jammer",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 4 },
    data: {
      label: "Obtain Signal Jammer",
      description: "Mechanic advised to look in laboratories",
      note: "Location: The Lab",
    },
  },
  {
    id: "talk-mechanic-jammer",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 5 },
    data: {
      label: "Talk to Mechanic",
      description: "Mechanic sent instructions on how to unlock the case",
    },
  },
  {
    id: "unlock-case-jammer",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 6 },
    data: {
      label: "Use Jammer to Unlock Case",
      description: "Use the experimental signal jammer at my Workbench",
    },
  },

  // ============ PATHS CONVERGE - READ INSTRUCTIONS ============
  {
    id: "read-instructions",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 7 },
    data: {
      label: "Read Case Instructions",
      description: "Examine documents - contains original escape plan for Tarkov",
    },
  },
  {
    id: "report-kerman",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 8 },
    data: {
      label: "Report to Kerman",
      description: "Inform him of case contents and the escape plan",
    },
  },

  // ============ DECISION 2: TRUST KERMAN ============
  {
    id: "trust-kerman",
    type: "decision",
    position: { x: 0, y: ROW_HEIGHT * 9 },
    data: {
      label: "Decision 2: Trust Mr. Kerman?",
      description: "Follow his plan or go your own way?",
      isIrreversible: true,
    },
  },

  // ============ KERMAN'S PATH (Left - Green/Best endings) ============
  {
    id: "trust-yes",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 10 },
    data: {
      label: "Accept Kerman's Offer",
      description: "Side with Kerman's alternative escape plan",
    },
  },
  {
    id: "activate-rfid-case",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 11 },
    data: {
      label: "Activate RFID from Case",
      description: "Kerman sends instructions - need Intel Center in Hideout",
      note: "Hideout: Intelligence Center",
    },
  },
  {
    id: "obtain-lab-master-pass",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 12 },
    data: {
      label: "Obtain Lab Master Pass",
      description: "Find in TerraGroup Lab offices (Kruglov's office)",
      note: "Location: The Lab",
    },
  },
  {
    id: "use-master-pass",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 13 },
    data: {
      label: "Use Lab Master Pass",
      description: "Activate Kruglov's keycard with the master pass",
    },
  },
  {
    id: "obtain-rfid-labs",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 14 },
    data: {
      label: "Search Labs for RFID (FAILS)",
      description: "RFID Encrypter cannot be found in Labs - this is intentional",
      note: "Scripted failure after ~5 raids/12hrs",
    },
  },
  {
    id: "talk-kerman-rfid",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 15 },
    data: {
      label: "Talk to Mr. Kerman",
      description: "Perhaps Kerman can find where else to locate the RFID device",
    },
  },
  {
    id: "talk-mechanic",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 16 },
    data: {
      label: "Talk to Mechanic",
      description: "Mechanic offers alternative: pay 40 BTC for Elektronik key",
    },
  },
  {
    id: "turn-in-btc",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 17 },
    data: {
      label: "Hand Over 40 Bitcoins",
      description: "Give 40 BTC to Mechanic, receive Elektronik key for 14A",
      cost: 40,
    },
  },
  {
    id: "collect-rfid-streets",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 18 },
    data: {
      label: "Use Elektronik Key at 14A",
      description: "Use key to access Klimov Street 14A and collect RFID Encrypter",
      note: "Location: Streets of Tarkov",
    },
  },
  {
    id: "activate-ticket",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 19 },
    data: {
      label: "Activate the Ticket",
      description: "Use Intel Center to encrypt/activate keycard",
    },
  },
  {
    id: "side-quests",
    type: "decision",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 20 },
    data: {
      label: "Complete ALL Side Quests?",
      description: "Batya, Bogatyr, Chronicles of Ryzhy required for Savior",
      isIrreversible: true,
    },
  },
  {
    id: "terminal-battle",
    type: "decision",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 21 },
    data: {
      label: "Terminal Battle",
      description: "Fight Black Division at Terminal - Do you survive?",
      isIrreversible: true,
    },
  },

  // ============ REFUSE KERMAN PATH (Shared nodes) ============
  {
    id: "trust-no",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 10 },
    data: {
      label: "Refuse Kerman",
      description: "Follow original instructions from the case",
    },
  },
  {
    id: "head-to-terminal",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 11 },
    data: {
      label: "Head to Terminal",
      description: "Go to port Terminal via Shoreline checkpoint",
    },
  },
  {
    id: "use-ticket-terminal",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 12 },
    data: {
      label: "Use Ticket at Terminal",
      description: "Swipe keycard at gate intercom - alerts authorities",
    },
  },
  {
    id: "meet-prapor",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 13 },
    data: {
      label: "Meet Prapor",
      description: "Prapor arrives with his men - he controls this exit",
    },
  },

  // ============ DECISION 3: PRAPOR'S BRIBE (splits based on Decision 1) ============
  {
    id: "prapor-bribe",
    type: "decision",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 14 },
    data: {
      label: "Decision 3: Pay Prapor's Bribe?",
      description: "₽300M (gave case) or ₽500M (kept case) to escape?",
      isIrreversible: true,
    },
  },
  {
    id: "pay-300m",
    type: "story",
    position: { x: COL_WIDTH * 0.2, y: ROW_HEIGHT * 17 },
    data: {
      label: "Pay ₽300 Million",
      description: "Loyalty discount - you gave Prapor the case",
      cost: 300000000,
    },
  },
  {
    id: "pay-500m",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 17 },
    data: {
      label: "Pay ₽500 Million",
      description: "No discount - you kept the case from Prapor",
      cost: 500000000,
    },
  },
  {
    id: "cant-pay",
    type: "story",
    position: { x: COL_WIDTH * 2.1, y: ROW_HEIGHT * 17 },
    data: {
      label: "Can't/Won't Pay",
      description: "Refuse or unable to pay Prapor's bribe",
    },
  },

  // ============ POST-PAYMENT STEPS (shared by 300m and 500m paths) ============
  {
    id: "prapor-tasks",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 18.5 },
    data: {
      label: "Complete Prapor's Tasks in Time",
      description: "Need to hurry, 72 hours for these three missions (0/3)",
    },
  },
  {
    id: "kill-pmcs-raid",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 19.5 },
    data: {
      label: "Eliminate PMC Operatives in One Raid",
      description: "Can't leave until all 4 targets are eliminated (0/4)",
    },
  },
  {
    id: "streets-targets",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 20.5 },
    data: {
      label: "Eliminate Targets on Streets of Tarkov",
      description: "Clear out 50 targets on Streets (0/50)",
    },
  },
  {
    id: "convert-evidence",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 21.5 },
    data: {
      label: "Convert Evidence Folders to SSD",
      description: "Digitalize info at Intelligence Center in Hideout (craft)",
      note: "6 hour craft at Intelligence Center",
    },
  },
  {
    id: "wait-evacuation",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 22.5 },
    data: {
      label: "Wait for the Evacuation to Begin",
      description: "The port is currently closed for evacuation, but they should start letting people through soon",
    },
  },

  // ============ ENDINGS ============
  {
    id: "savior-ending",
    type: "ending",
    position: { x: -COL_WIDTH * 1.8, y: ROW_HEIGHT * 24 },
    data: {
      label: "🌟 Savior Ending",
      description: "Best: Save Tarkov, thwart bad actors. Complete ALL side quests + survive Terminal",
      endingType: "savior",
    },
  },
  {
    id: "fallen-ending",
    type: "ending",
    position: { x: -COL_WIDTH * 0.6, y: ROW_HEIGHT * 24 },
    data: {
      label: "� Fallen Ending",
      description: "Escape but 'fall into darkness' - skipped side quests or failed Terminal",
      endingType: "fallen",
    },
  },
  {
    id: "survivor-ending",
    type: "ending",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 24 },
    data: {
      label: "🛡️ Survivor Ending",
      description: "Buy freedom with ₽300M or ₽500M and complete all tasks",
      endingType: "survivor",
    },
  },
  {
    id: "debtor-ending",
    type: "ending",
    position: { x: COL_WIDTH * 2.1, y: ROW_HEIGHT * 24 },
    data: {
      label: "⛓️ Debtor Ending",
      description: "Worst: Can't pay bribe - debts catch up",
      endingType: "debtor",
    },
  },
];

export const initialEdges: Edge[] = [
  // ============ PROLOGUE ============
  {
    id: "e-prologue-retrieve",
    source: "prologue",
    target: "retrieve-case",
    style: { stroke: "#666" },
  },
  {
    id: "e-retrieve-start",
    source: "retrieve-case",
    target: "start",
    style: { stroke: "#666" },
  },

  // ============ DECISION 1: ARMORED CASE ============
  {
    id: "e-start-give",
    source: "start",
    target: "give-prapor",
    label: "Hand Over",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-start-keep",
    source: "start",
    target: "keep-case",
    label: "Keep It",
    style: { stroke: "#8b5cf6" },
  },

  // ============ PRAPOR'S BRANCH (Green path - Recommended) ============
  {
    id: "e-give-ticket",
    source: "give-prapor",
    target: "the-ticket-prapor",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-ticket-contact",
    source: "the-ticket-prapor",
    target: "contact-kerman-prapor",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-contact-investigate",
    source: "contact-kerman-prapor",
    target: "investigate-lighthouse",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-investigate-lk",
    source: "investigate-lighthouse",
    target: "unlock-lightkeeper",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-lk-recover",
    source: "unlock-lightkeeper",
    target: "recover-case-lk",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-recover-read",
    source: "recover-case-lk",
    target: "read-instructions",
    style: { stroke: "#22c55e" },
  },

  // ============ INDEPENDENT BRANCH (Purple path) ============
  {
    id: "e-keep-intel",
    source: "keep-case",
    target: "intel-center-keep",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-intel-kerman",
    source: "intel-center-keep",
    target: "talk-kerman-keep",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-kerman-mechanic",
    source: "talk-kerman-keep",
    target: "ask-mechanic-help",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-mechanic-jammer",
    source: "ask-mechanic-help",
    target: "obtain-jammer",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-jammer-talk",
    source: "obtain-jammer",
    target: "talk-mechanic-jammer",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-talk-unlock",
    source: "talk-mechanic-jammer",
    target: "unlock-case-jammer",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-unlock-read",
    source: "unlock-case-jammer",
    target: "read-instructions",
    style: { stroke: "#8b5cf6" },
  },

  // ============ PATHS CONVERGE ============
  {
    id: "e-read-report",
    source: "read-instructions",
    target: "report-kerman",
    style: { stroke: "#666" },
  },
  {
    id: "e-report-trust",
    source: "report-kerman",
    target: "trust-kerman",
    style: { stroke: "#666" },
  },

  // ============ DECISION 2: TRUST KERMAN ============
  {
    id: "e-trust-yes",
    source: "trust-kerman",
    target: "trust-yes",
    label: "Trust Him",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-trust-no",
    source: "trust-kerman",
    target: "trust-no",
    label: "Refuse",
    style: { stroke: "#3b82f6" },
  },

  // ============ KERMAN'S PATH (Green - Best endings) ============
  {
    id: "e-yes-activate-rfid",
    source: "trust-yes",
    target: "activate-rfid-case",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-activate-rfid-masterpass",
    source: "activate-rfid-case",
    target: "obtain-lab-master-pass",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-masterpass-use",
    source: "obtain-lab-master-pass",
    target: "use-master-pass",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-use-masterpass-rfid-labs",
    source: "use-master-pass",
    target: "obtain-rfid-labs",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-rfid-labs-talk-kerman",
    source: "obtain-rfid-labs",
    target: "talk-kerman-rfid",
    label: "Failed",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-talk-kerman-mechanic",
    source: "talk-kerman-rfid",
    target: "talk-mechanic",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-mechanic-btc",
    source: "talk-mechanic",
    target: "turn-in-btc",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-btc-collect-rfid",
    source: "turn-in-btc",
    target: "collect-rfid-streets",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-collect-rfid-activate",
    source: "collect-rfid-streets",
    target: "activate-ticket",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-activate-sidequests",
    source: "activate-ticket",
    target: "side-quests",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-sidequests-terminal",
    source: "side-quests",
    target: "terminal-battle",
    style: { stroke: "#22c55e" },
  },

  // ============ TERMINAL BATTLE OUTCOMES ============
  {
    id: "e-terminal-savior",
    source: "terminal-battle",
    target: "savior-ending",
    label: "Survive + All Quests",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-terminal-fallen",
    source: "terminal-battle",
    target: "fallen-ending",
    label: "Survive (No Quests)",
    style: { stroke: "#6b7280" },
  },

  // ============ REFUSE KERMAN PATH (Blue - Survivor/Debtor) ============
  {
    id: "e-no-terminal",
    source: "trust-no",
    target: "head-to-terminal",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-terminal-use",
    source: "head-to-terminal",
    target: "use-ticket-terminal",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-use-meet",
    source: "use-ticket-terminal",
    target: "meet-prapor",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-meet-bribe",
    source: "meet-prapor",
    target: "prapor-bribe",
    style: { stroke: "#3b82f6" },
  },

  // ============ DECISION 3: PRAPOR'S BRIBE ============
  {
    id: "e-bribe-pay-300m",
    source: "prapor-bribe",
    target: "pay-300m",
    label: "Pay ₽300M (Loyal)",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-bribe-pay-500m",
    source: "prapor-bribe",
    target: "pay-500m",
    label: "Pay ₽500M (Kept)",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-bribe-refuse",
    source: "prapor-bribe",
    target: "cant-pay",
    label: "Refuse",
    style: { stroke: "#ef4444" },
  },

  // ============ POST-PAYMENT STEPS ============
  {
    id: "e-300m-prapor-tasks",
    source: "pay-300m",
    target: "prapor-tasks",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-500m-prapor-tasks",
    source: "pay-500m",
    target: "prapor-tasks",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-prapor-tasks-pmcs",
    source: "prapor-tasks",
    target: "kill-pmcs-raid",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-pmcs-streets",
    source: "kill-pmcs-raid",
    target: "streets-targets",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-streets-evidence",
    source: "streets-targets",
    target: "convert-evidence",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-evidence-evacuation",
    source: "convert-evidence",
    target: "wait-evacuation",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-evacuation-survivor",
    source: "wait-evacuation",
    target: "survivor-ending",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-cantpay-debtor",
    source: "cant-pay",
    target: "debtor-ending",
    style: { stroke: "#ef4444" },
  },
];
