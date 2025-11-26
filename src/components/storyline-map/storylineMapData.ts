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
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 1 },
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
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 1.75 },
    data: {
      label: "The Ticket Quest",
      description: "Build Intel Center 1, wait for Kerman's call",
      note: "Hideout: Intelligence Center Level 1",
    },
  },
  {
    id: "contact-kerman-prapor",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 2.4 },
    data: {
      label: "Contact Mr. Kerman",
      description: "Kerman says you need the case back",
    },
  },
  {
    id: "investigate-lighthouse",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 3.1 },
    data: {
      label: "Investigate Lighthouse Camp",
      description: "Search Prapor's camp on Lighthouse for clues",
    },
  },
  {
    id: "talk-mechanic-network",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 3.9 },
    data: {
      label: "Talk to Mechanic (Network Provider)",
      description: "Mechanic helps unlock Lightkeeper access early",
    },
  },
  {
    id: "unlock-lightkeeper",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 4.7 },
    data: {
      label: "Unlock Lightkeeper",
      description: "Complete tasks to gain access to Lightkeeper trader",
    },
  },
  {
    id: "lk-blue-folders",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 5.5 },
    data: {
      label: "Hand Over 3 Blue Folders",
      description: "Give 3 Intelligence folders to Lightkeeper",
    },
  },
  {
    id: "lk-flare-kills",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 6.1 },
    data: {
      label: "Yellow Flare + 15 Kills",
      description: "Launch yellow flare at ULTRA entrance on Interchange, then eliminate 15 targets in one raid",
      note: "In one raid",
    },
  },
  {
    id: "recover-case-lk",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 7 },
    data: {
      label: "Recover Case from LK",
      description: "Lightkeeper returns the case contents after his requests",
    },
  },

  // ============ INDEPENDENT BRANCH (Right side - Gray/Purple) ============
  {
    id: "keep-case",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 1 },
    data: {
      label: "Keep the Case",
      description: "Prapor gets mad: -0.5 rep",
      isIrreversible: true,
    },
  },
  {
    id: "timegate-55h",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 3 },
    data: {
      label: "⏳ 55 Hour Timegate",
      description: "Wait ~55 hours before case can be unlocked",
      note: "Time gate penalty for keeping case",
    },
  },
  {
    id: "intel-center-keep",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 5 },
    data: {
      label: "Intelligence Center Level 1",
      description: "To contact Mr. Kerman, I need a working laptop",
      note: "Hideout: Intelligence Center Level 1",
    },
  },
  {
    id: "talk-kerman-keep",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 7 },
    data: {
      label: "Talk to Mr. Kerman",
      description: "Kerman said to contact him through my Intelligence Center",
    },
  },
  // ============ SHARED MECHANIC/JAMMER SEQUENCE (Both paths merge here) ============
  {
    id: "ask-mechanic-help",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 8 },
    data: {
      label: "Ask Mechanic for Help",
      description: "Case uses high-grade electronic lock, need special equipment",
    },
  },
  {
    id: "obtain-jammer",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 9 },
    data: {
      label: "Obtain Signal Jammer",
      description: "Mechanic advised to look in laboratories",
      note: "Location: The Lab",
    },
  },
  {
    id: "talk-mechanic-jammer",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 10 },
    data: {
      label: "Talk to Mechanic",
      description: "Mechanic sent instructions on how to unlock the case",
    },
  },
  {
    id: "unlock-case-jammer",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 11 },
    data: {
      label: "Use Jammer to Unlock Case",
      description: "Use the experimental signal jammer at my Workbench",
    },
  },

  // ============ PATHS CONVERGE - READ INSTRUCTIONS ============
  {
    id: "read-instructions",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 12 },
    data: {
      label: "Read Case Instructions",
      description: "Examine documents - contains original escape plan for Tarkov",
    },
  },
  {
    id: "report-kerman",
    type: "story",
    position: { x: 0, y: ROW_HEIGHT * 13 },
    data: {
      label: "Report to Kerman",
      description: "Inform him of case contents and the escape plan",
    },
  },

  // ============ DECISION 2: TRUST KERMAN ============
  {
    id: "trust-kerman",
    type: "decision",
    position: { x: 0, y: ROW_HEIGHT * 14 },
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
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 15 },
    data: {
      label: "Accept Kerman's Offer",
      description: "Side with Kerman's alternative escape plan",
    },
  },
  {
    id: "activate-rfid-case",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 16 },
    data: {
      label: "Activate RFID from Case",
      description: "Kerman sends instructions - need Intel Center in Hideout",
      note: "Hideout: Intelligence Center",
    },
  },
  {
    id: "obtain-lab-master-pass",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 17 },
    data: {
      label: "Obtain Lab Master Pass",
      description: "Find in TerraGroup Lab offices (Kruglov's office)",
      note: "Location: The Lab",
    },
  },
  {
    id: "use-master-pass",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 18 },
    data: {
      label: "Use Lab Master Pass",
      description: "Activate Kruglov's keycard with the master pass",
    },
  },
  {
    id: "obtain-rfid-labs",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 19 },
    data: {
      label: "Search Labs for RFID (FAILS)",
      description: "RFID Encrypter cannot be found in Labs - this is intentional",
      note: "Scripted failure after ~5 raids/12hrs",
    },
  },
  {
    id: "talk-kerman-rfid",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 20 },
    data: {
      label: "Talk to Mr. Kerman",
      description: "Perhaps Kerman can find where else to locate the RFID device",
    },
  },
  {
    id: "talk-mechanic",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 21 },
    data: {
      label: "Talk to Mechanic",
      description: "Mechanic offers alternative: pay 40 BTC for Elektronik key",
    },
  },
  {
    id: "turn-in-btc",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 22 },
    data: {
      label: "Hand Over 40 Bitcoins",
      description: "Give 40 BTC to Mechanic for Elektronik key",
      cost: 40,
    },
  },
  {
    id: "timegate-24-40h",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 23 },
    data: {
      label: "⏳ Wait for Mechanic Response",
      description: "Wait about a day for Mechanic to prepare",
      note: "~24 hour timegate",
    },
  },
  {
    id: "collect-rfid-streets",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 24 },
    data: {
      label: "Collect RFID Encrypter",
      description: "Collect from Klimov Street 14A",
      note: "Location: Streets of Tarkov",
    },
  },
  {
    id: "use-rfid-keycard",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 25 },
    data: {
      label: "Activate Kruglov's Keycard",
      description: "Use RFID encryption device to activate the keycard",
    },
  },
  {
    id: "arrive-terminal-kerman",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 26 },
    data: {
      label: "Arrive at Port Terminal",
      description: "The only way to access the port should be through Shoreline",
      note: "Location: Shoreline → Terminal",
    },
  },
  {
    id: "swipe-keycard-kerman",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 27 },
    data: {
      label: "Swipe Keycard at Intercom",
      description: "The intercom is on the road leading to the terminal gate",
      note: "Card doesn't work! Alerts authorities",
    },
  },
  {
    id: "speak-kerman-final",
    type: "story",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 28 },
    data: {
      label: "Talk to Mr. Kerman",
      description: "The card didn't work - need to find another way",
    },
  },
  {
    id: "side-quests",
    type: "decision",
    position: { x: -COL_WIDTH * 1.2, y: ROW_HEIGHT * 29 },
    data: {
      label: "Agree to Find Dirt on TerraGroup?",
      description: "Help Kerman gather evidence - will take time and effort",
      isIrreversible: true,
    },
  },
  {
    id: "complete-story-tasks",
    type: "story",
    position: { x: -COL_WIDTH * 1.8, y: ROW_HEIGHT * 30.5 },
    data: {
      label: "Complete All Story Tasks",
      description: "Batya, Bogatyr, Chronicles of Ryzhy side quests",
      note: "Required for Savior ending",
    },
  },

  // ============ REFUSE KERMAN PATH (Shared nodes) ============
  {
    id: "trust-no",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 15 },
    data: {
      label: "Refuse Kerman",
      description: "Follow original instructions from the case",
    },
  },
  {
    id: "head-to-terminal",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 16 },
    data: {
      label: "Head to Terminal",
      description: "Go to port Terminal via Shoreline checkpoint",
    },
  },
  {
    id: "use-ticket-terminal",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 17 },
    data: {
      label: "Use Ticket at Terminal",
      description: "Swipe keycard at gate intercom - alerts authorities",
    },
  },
  {
    id: "meet-prapor",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 18 },
    data: {
      label: "Meet Prapor",
      description: "Prapor arrives with his men - he controls this exit",
    },
  },

  // ============ DECISION 3: PRAPOR'S BRIBE (splits based on Decision 1) ============
  {
    id: "prapor-bribe",
    type: "decision",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 18.75 },
    data: {
      label: "Decision 3: Pay Prapor's Bribe?",
      description: "₽300M (gave case) or ₽500M (kept case) to escape?",
      isIrreversible: true,
    },
  },
  {
    id: "pay-300m",
    type: "story",
    position: { x: COL_WIDTH * 0.2, y: ROW_HEIGHT * 20 },
    data: {
      label: "Pay ₽300 Million",
      description: "Loyalty discount - you gave Prapor the case",
      cost: 300000000,
    },
  },
  {
    id: "pay-500m",
    type: "story",
    position: { x: COL_WIDTH * 1.2, y: ROW_HEIGHT * 20 },
    data: {
      label: "Pay ₽500 Million",
      description: "No discount - you kept the case from Prapor",
      cost: 500000000,
    },
  },
  {
    id: "cant-pay",
    type: "story",
    position: { x: COL_WIDTH * 2.1, y: ROW_HEIGHT * 20 },
    data: {
      label: "Can't/Won't Pay",
      description: "Refuse or unable to pay Prapor's bribe",
    },
  },

  // ============ POST-PAYMENT STEPS (shared by 300m and 500m paths) ============
  {
    id: "prapor-tasks",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 21 },
    data: {
      label: "Complete Prapor's Tasks in Time",
      description: "Need to hurry, 72 hours for these three missions (0/3)",
    },
  },
  {
    id: "kill-pmcs-raid",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 22 },
    data: {
      label: "Eliminate PMC Operatives in One Raid",
      description: "Can't leave until all 4 targets are eliminated (0/4)",
    },
  },
  {
    id: "streets-targets",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 23 },
    data: {
      label: "Eliminate Targets on Streets of Tarkov",
      description: "Clear out 50 targets on Streets (0/50)",
    },
  },
  {
    id: "convert-evidence",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 24 },
    data: {
      label: "Convert Evidence Folders to SSD",
      description: "Digitalize info at Intelligence Center in Hideout (craft)",
      note: "6 hour craft at Intelligence Center",
    },
  },
  {
    id: "wait-evacuation",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 25 },
    data: {
      label: "Wait for the Evacuation to Begin",
      description: "The port is currently closed for evacuation",
    },
  },
  {
    id: "timegate-indefinite",
    type: "story",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 26 },
    data: {
      label: "⏳ Indefinite Timegate",
      description: "Unknown wait time before evacuation opens",
      note: "May take considerable time",
    },
  },

  // ============ UNKNOWN TERRITORY ZONE ============
  {
    id: "unknown-zone",
    type: "zone",
    position: { x: -COL_WIDTH * 2.5, y: ROW_HEIGHT * 30.2 },
    draggable: false,
    selectable: false,
    zIndex: -1,
    data: {
      width: COL_WIDTH * 6,
      height: ROW_HEIGHT * 5,
    },
  },

  // ============ ENDINGS ============
  {
    id: "savior-ending",
    type: "ending",
    position: { x: -COL_WIDTH * 1.8, y: ROW_HEIGHT * 32.5 },
    data: {
      label: "🌟 Savior Ending",
      description: "Best: Save Tarkov, complete all story tasks for Kerman",
      endingType: "savior",
    },
  },
  {
    id: "fallen-ending",
    type: "ending",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 32.5 },
    data: {
      label: "❌ Fallen Ending",
      description: "Refused to help Kerman gather evidence",
      endingType: "fallen",
    },
  },
  {
    id: "survivor-ending",
    type: "ending",
    position: { x: COL_WIDTH * 0.7, y: ROW_HEIGHT * 32.5 },
    data: {
      label: "🛡️ Survivor Ending",
      description: "Buy freedom with ₽300M or ₽500M and complete all tasks",
      endingType: "survivor",
    },
  },
  {
    id: "debtor-ending",
    type: "ending",
    position: { x: COL_WIDTH * 2.1, y: ROW_HEIGHT * 32.5 },
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
    id: "e-investigate-mechanic-network",
    source: "investigate-lighthouse",
    target: "talk-mechanic-network",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-mechanic-network-lk",
    source: "talk-mechanic-network",
    target: "unlock-lightkeeper",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-lk-blue-folders",
    source: "unlock-lightkeeper",
    target: "lk-blue-folders",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-blue-folders-flare",
    source: "lk-blue-folders",
    target: "lk-flare-kills",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-flare-recover",
    source: "lk-flare-kills",
    target: "recover-case-lk",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-recover-mechanic",
    source: "recover-case-lk",
    target: "ask-mechanic-help",
    style: { stroke: "#22c55e" },
  },

  // ============ INDEPENDENT BRANCH (Purple path) ============
  {
    id: "e-keep-timegate",
    source: "keep-case",
    target: "timegate-55h",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-timegate-intel",
    source: "timegate-55h",
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
    style: { stroke: "#666" },
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
    id: "e-btc-timegate",
    source: "turn-in-btc",
    target: "timegate-24-40h",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-timegate-collect-rfid",
    source: "timegate-24-40h",
    target: "collect-rfid-streets",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-collect-rfid-use",
    source: "collect-rfid-streets",
    target: "use-rfid-keycard",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-use-rfid-arrive",
    source: "use-rfid-keycard",
    target: "arrive-terminal-kerman",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-arrive-swipe",
    source: "arrive-terminal-kerman",
    target: "swipe-keycard-kerman",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-swipe-speak-kerman",
    source: "swipe-keycard-kerman",
    target: "speak-kerman-final",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-speak-kerman-sidequests",
    source: "speak-kerman-final",
    target: "side-quests",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-sidequests-complete",
    source: "side-quests",
    target: "complete-story-tasks",
    label: "Yes",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-sidequests-fallen",
    source: "side-quests",
    target: "fallen-ending",
    label: "No",
    style: { stroke: "#6b7280" },
  },

  // ============ STORY COMPLETION OUTCOMES ============
  {
    id: "e-complete-savior",
    source: "complete-story-tasks",
    target: "savior-ending",
    style: { stroke: "#22c55e" },
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
    id: "e-evacuation-timegate",
    source: "wait-evacuation",
    target: "timegate-indefinite",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-timegate-survivor",
    source: "timegate-indefinite",
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
