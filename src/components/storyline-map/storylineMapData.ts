import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PathStep {
  id: string;
  label: string;
  description?: string;
  note?: string;
  cost?: number;
  currency?: "roubles" | "btc" | "usd";
  isCraft?: boolean;
  craftHours?: number;
  isTimeGate?: boolean;
  timeGateHours?: number;
}

export interface PathBreakdown {
  steps: PathStep[];
  totalCostRoubles: number;
  totalCostBTC: number;
  totalCostUSD: number;
  totalCraftHours: number;
  totalTimeGateHours: number;
}

type StorylineNode = Node<Record<string, unknown>, string>;
type StorylineNodeInput = Omit<StorylineNode, "position"> & {
  position?: StorylineNode["position"];
};

const storylineNodePositions = {
  title: { x: 800, y: -500 },
  recover: { x: 800, y: -400 },
  "keep-self": { x: 500, y: -280 },
  "give-prapor-0": { x: 1074, y: -276 },
  "prapor-comp": { x: 1042, y: -132 },
  "lk-access": { x: 1070, y: -29 },
  "talk-lk-0": { x: 1061, y: 55 },
  "yellow-flare": { x: 1043, y: 145 },
  "kill-15": { x: 1065, y: 255 },
  "lk-case": { x: 1057, y: 356 },
  "armored-hands": { x: 791, y: 457 },
  "open-case": { x: 799, y: 546 },
  "tg-48": { x: 790, y: 628 },
  "case-open": { x: 800, y: 728 },
  "dont-work": { x: 400, y: 850 },
  "work-together": { x: 1200, y: 850 },
  "sl-shore": { x: 50, y: 1000 },
  "sl-key-fail": { x: 50, y: 1100 },
  "sl-300": { x: -212, y: 1228 },
  "sl-500": { x: 315, y: 1225 },
  "sl-tg": { x: 315, y: 1394 },
  "sl-5": { x: 329, y: 1480 },
  "sl-flash": { x: 302, y: 1576 },
  "sl-kill-50": { x: 329, y: 1680 },
  "sl-kill-4": { x: 331, y: 1768 },
  "sl-48": { x: 326, y: 1856 },
  "sl-note": { x: 31, y: 2006 },
  "sl-easy": { x: 31, y: 2106 },
  "end-setup-survivor": { x: 137, y: 3533 },
  "fail-survivor": { x: 138, y: 3673 },
  "survivor-ending": { x: 160, y: 3834 },
  "wt-search": { x: 1193, y: 1011 },
  "wt-keycard": { x: 1193, y: 1111 },
  "tg-24": { x: 1197, y: 1189 },
  "wt-pay-mech": { x: 1197, y: 1289 },
  "wt-elekt": { x: 1192, y: 1442 },
  "wt-activate": { x: 1192, y: 1542 },
  "tg-50": { x: 1192, y: 1642 },
  "wt-shore": { x: 1192, y: 1742 },
  "hk-savior": { x: 724, y: 1877 },
  "nk-fallen": { x: 1200, y: 1850 },
  "hk-debtor": { x: 1792, y: 1864 },
  "audio-note": { x: 716, y: 2057 },
  "complete-all": { x: 716, y: 2157 },
  "tg-48b": { x: 746, y: 2271 },
  trusted: { x: 716, y: 2374 },
  "fence-4": { x: 716, y: 2474 },
  pvp: { x: 613, y: 2601 },
  pve: { x: 882, y: 2603 },
  "kill-5-no-scav": { x: 852, y: 2705 },
  coop: { x: 600, y: 2705 },
  "btr-04": { x: 733, y: 2872 },
  "warn-btr": { x: -424, y: 2577 },
  "solar-savior": { x: 749, y: 3039 },
  "build-72-savior": { x: 770, y: 3186 },
  "final-craft-savior": { x: 770, y: 3286 },
  "end-setup-savior": { x: 775, y: 3545 },
  "fail-savior": { x: 775, y: 3678 },
  "savior-ending": { x: 807, y: 3827 },
  enough: { x: 1182, y: 2018 },
  "talk-prapor": { x: 1223, y: 2129 },
  "case-back": { x: 1030, y: 2222 },
  "no-case-back": { x: 1320, y: 2223 },
  "repair-40": { x: 1350, y: 2353 },
  "secure-cont": { x: 1320, y: 2443 },
  "military-50": { x: 1320, y: 2543 },
  "bio-case": { x: 1200, y: 2660 },
  "usd-1m": { x: 1229, y: 2770 },
  "will-blow": { x: 1214, y: 2941 },
  "tg-48c": { x: 1222, y: 3044 },
  "hash-usb": { x: 1193, y: 3141 },
  "solar-fallen": { x: 1211, y: 3242 },
  "build-72-fallen": { x: 1225, y: 3339 },
  "final-craft-fallen": { x: 1213, y: 3442 },
  "end-setup-fallen": { x: 1196, y: 3563 },
  "fail-fallen": { x: 1196, y: 3698 },
  "fallen-ending": { x: 1207, y: 3827 },
  "hand-2-major": { x: 1776, y: 2053 },
  "u-turn": { x: 1812, y: 2169 },
  "talk-lk": { x: 1812, y: 2277 },
  topo: { x: 1785, y: 2360 },
  "tg-24b": { x: 1810, y: 2475 },
  "hash-drive": { x: 1780, y: 2573 },
  "kill-30": { x: 1803, y: 2686 },
  amulet: { x: 1783, y: 2782 },
  place: { x: 1787, y: 2907 },
  "tg-48d": { x: 1814, y: 3034 },
  "lk-key": { x: 1787, y: 3154 },
  "end-setup-debtor": { x: 1795, y: 3581 },
  "fail-debtor": { x: 1796, y: 3714 },
  "debtor-ending": { x: 1807, y: 3827 },
} as const;

function applyStorylineNodePositions(
  nodes: StorylineNodeInput[]
): StorylineNode[] {
  const positionMap = storylineNodePositions as Record<
    string,
    { x: number; y: number }
  >;

  return nodes.map((node) => {
    const pos = positionMap[node.id];
    return {
      ...node,
      position: pos || node.position || { x: 0, y: 0 },
    };
  });
}

// ============================================================================
// NODES - Version 1.3.1 (last edited: 14.12.2025)
// Based on Mermaid flowchart from @Callsign_Smokey
// ============================================================================

export const initialNodes: StorylineNode[] = applyStorylineNodePositions([
  // ==================== TITLE / VERSION ====================
  {
    id: "title",
    type: "story",
    data: {
      label: "The Ticket",
      description: "Unlock by completing the Fallen Skies storyline chapter",
    },
  },

  // ==================== TOP: ARMORED CASE ====================
  {
    id: "recover",
    type: "story",
    data: {
      label: "Recover Armored Case from Wrecked Crashed Plane",
      description: "Starting point of the storyline",
    },
  },

  // Initial case decision
  {
    id: "keep-self",
    type: "decision",
    data: {
      label: "Keep Case for yourself",
      description: "Point of no return",
      isIrreversible: true,
    },
  },
  {
    id: "give-prapor-0",
    type: "decision",
    data: {
      label: "Hand over Case to Prapor",
      description: "Point of no return",
      isIrreversible: true,
    },
  },

  // Prapor path to get case back
  {
    id: "prapor-comp",
    type: "story",
    data: {
      label: "Find compromising material on Prapor",
      description: "on Lighthouse",
    },
  },
  {
    id: "lk-access",
    type: "story",
    data: {
      label: "Gain Lightkeeper Access",
      description: "(Network Provider 1 is available)",
    },
  },
  {
    id: "talk-lk-0",
    type: "story",
    data: {
      label: "Talk to Lightkeeper",
      description: "(Pay him 3x Terragroup Blue Folder)",
    },
  },
  {
    id: "yellow-flare",
    type: "story",
    data: {
      label: "Fire Yellow Flare in front of Ultra Mall",
      description: "(Interchange)",
    },
  },
  {
    id: "kill-15",
    type: "story",
    data: {
      label: "Kill 15 Targets without dying",
      description: "(one Raid)",
    },
  },
  {
    id: "lk-case",
    type: "story",
    data: {
      label: "Collect Case from Lightkeeper",
      description: "(goes into Special Slot)",
    },
  },

  // Convergence: Armored Case in hands
  {
    id: "armored-hands",
    type: "story",
    data: {
      label: "Armored Case in your Hands",
      description: "Both paths converge here",
    },
  },
  {
    id: "open-case",
    type: "story",
    data: {
      label: "Open the Case",
      description: "(find Signal Jammer on Labs)",
    },
  },
  {
    id: "tg-48",
    type: "craft",
    data: {
      label: "48h Craft at Workbench",
      description: "Craft to open the case",
      isCraft: true,
      craftHours: 48,
    },
  },
  {
    id: "case-open",
    type: "story",
    data: {
      label: "Case is open",
      description: "Ready to proceed",
    },
  },

  // ==================== SPLIT: Work with Kerman ====================
  {
    id: "dont-work",
    type: "decision",
    data: {
      label: "Don't work with Kerman",
      description: "Point of no return - Survivor path",
      isIrreversible: true,
    },
  },
  {
    id: "work-together",
    type: "decision",
    data: {
      label: "Work together with Kerman",
      description: "Point of no return - Multiple endings available",
      isIrreversible: true,
    },
  },

  // ==================== SURVIVOR PATH (Don't work with Kerman) ====================
  {
    id: "sl-shore",
    type: "story",
    data: {
      label: "Head to Shoreline Port Entrance",
      description: "(Intercom) swipe Keycard",
    },
  },
  {
    id: "sl-key-fail",
    type: "story",
    data: {
      label: "Keycard didn't work",
      description: "Ask Prapor for help",
    },
  },

  // Cost decision (parallel branches)
  {
    id: "sl-300",
    type: "story",
    data: {
      label: "Prapor wants 300 Million Roubles",
      description: "since you gave him the Case",
      cost: 300000000,
      currency: "roubles",
      note: "300M ₽ (if gave case to Prapor)",
    },
  },
  {
    id: "sl-500",
    type: "story",
    data: {
      label: "Prapor wants 500 Million Roubles",
      description: "since you kept the Case",
      cost: 500000000,
      currency: "roubles",
      note: "500M ₽ (if kept case)",
    },
  },

  // Main linear task chain for 500M path
  {
    id: "sl-tg",
    type: "story",
    data: {
      label: "Find 4 Terragroup report folders",
      description: "on Labs",
    },
  },
  {
    id: "sl-5",
    type: "craft",
    data: {
      label: "5h Craft at Intel Centre",
      description: "Process the data",
      isCraft: true,
      craftHours: 5,
    },
  },
  {
    id: "sl-flash",
    type: "story",
    data: {
      label: "Give Prapor the Flash Drive with Data",
      description: "Hand over the processed intel",
    },
  },
  {
    id: "sl-kill-50",
    type: "story",
    data: {
      label: "Kill 50 targets",
      description: "on Streets of Tarkov",
    },
  },
  {
    id: "sl-kill-4",
    type: "story",
    data: {
      label: "Kill 4 PMCs",
      description: "(single raid and survive)",
    },
  },
  {
    id: "sl-48",
    type: "craft",
    data: {
      label: "48h Timegate",
      description: "Wait for Prapor",
      isTimeGate: true,
      timeGateHours: 48,
    },
  },

  // Convergence point for both cost paths
  {
    id: "sl-note",
    type: "story",
    data: {
      label: "Prapor hands you a Note",
      description: "for the Soldiers at the Terminal",
    },
  },
  {
    id: "sl-easy",
    type: "achievement",
    data: {
      label: "Easy Way",
      description: "Achievement Unlocked",
      note: "🏆 Achievement: Easy Way",
    },
  },

  // Survivor ending sequence
  {
    id: "end-setup-survivor",
    type: "story",
    data: {
      label: "Head to Shoreline (22:00 to 04:00)",
      description:
        "Intercom at Tower, swipe Keycard. Approach Terminal (no weapon in hand). Start escape attempt",
      note: "Final extraction sequence",
    },
  },
  {
    id: "fail-survivor",
    type: "story",
    data: {
      label: "If attempt fails:",
      description: "Buy a new Note for 5M roubles at Prapor (2 per reset)",
      cost: 5000000,
      currency: "roubles",
    },
  },
  {
    id: "survivor-ending",
    type: "ending",
    data: {
      label: "Survivor Ending",
      description: "You escaped Tarkov as a Survivor",
      endingType: "survivor",
    },
  },

  // ==================== WORK TOGETHER PATH ====================
  {
    id: "wt-search",
    type: "story",
    data: {
      label: "Search for Masterkeycard and RFID Device",
      description: "on Labs",
    },
  },
  {
    id: "wt-keycard",
    type: "story",
    data: {
      label: "Keycard acquired, device not:",
      description: "talk to Mechanic",
    },
  },
  {
    id: "tg-24",
    type: "craft",
    data: {
      label: "24h timegate",
      description: "Wait for Mechanic",
      isTimeGate: true,
      timeGateHours: 24,
    },
  },
  {
    id: "wt-pay-mech",
    type: "story",
    data: {
      label: "Pay Mechanic 40 Bitcoins",
      description: "Payment for RFID device info",
      cost: 40,
      currency: "btc",
      note: "40 BTC",
    },
  },
  {
    id: "wt-elekt",
    type: "story",
    data: {
      label: "Go with Mechanic's keys to Elektronik apartment",
      description: "and get RFID Device",
    },
  },
  {
    id: "wt-activate",
    type: "story",
    data: {
      label: "Activate RFID Card from Armored Case",
      description: "Prepare the card",
    },
  },
  {
    id: "tg-50",
    type: "craft",
    data: {
      label: "50h Craft at Intel Centre",
      description: "Process the RFID card",
      isCraft: true,
      craftHours: 50,
    },
  },
  {
    id: "wt-shore",
    type: "story",
    data: {
      label: "Head to Shoreline",
      description: "Port Entrance (Intercom) swipe Keycard",
    },
  },

  // ==================== POST-SWIPE: 3 branches ====================
  {
    id: "hk-savior",
    type: "decision",
    data: {
      label: "Help Kerman find Evidence on Terragroup",
      description: "Point of no return - Savior path",
      isIrreversible: true,
    },
  },
  {
    id: "nk-fallen",
    type: "decision",
    data: {
      label: "Do not help Kerman find Evidence on Terragroup",
      description: "Point of no return - Fallen path",
      isIrreversible: true,
    },
  },
  {
    id: "hk-debtor",
    type: "decision",
    data: {
      label: "Help Kerman find Evidence on Terragroup",
      description: "Point of no return - Debtor path (partial help)",
      isIrreversible: true,
    },
  },

  // ==================== SAVIOR PATH ====================
  {
    id: "audio-note",
    type: "story",
    data: {
      label: "Listen to every audiotape and read every note",
      description: "for all storys",
    },
  },
  {
    id: "complete-all",
    type: "story",
    data: {
      label: "Complete every other story chapter",
      description: "and hand evidence in",
    },
  },
  {
    id: "tg-48b",
    type: "craft",
    data: {
      label: "48h timegate",
      description: "Wait for Kerman",
      isTimeGate: true,
      timeGateHours: 48,
    },
  },
  {
    id: "trusted",
    type: "story",
    data: {
      label: "Kerman's trusted contact reaches out (Fence)",
      description: "New contact established",
    },
  },
  {
    id: "fence-4",
    type: "story",
    data: {
      label: "Get 4.0 Fence reputation",
      description: "Required reputation level",
    },
  },

  // PVP/PVE split
  {
    id: "pvp",
    type: "story",
    data: {
      label: "PVP",
      description: "PVP Path",
    },
  },
  {
    id: "pve",
    type: "story",
    data: {
      label: "PVE",
      description: "PVE Path",
    },
  },
  {
    id: "kill-5-no-scav",
    type: "story",
    data: {
      label: "Kill 5 PMCs in a raid without killing scavs",
      description: "(Shoreline and Interchange)",
    },
  },
  {
    id: "coop",
    type: "story",
    data: {
      label: "Use Co-Op extract with a scav",
      description: "(Woods and Reserve)",
    },
  },
  {
    id: "btr-04",
    type: "story",
    data: {
      label: "Raise BTR driver reputation to 0.4",
      description: "(complete The Price of Independence)",
    },
  },
  {
    id: "warn-btr",
    type: "story",
    data: {
      label: "⚠️ Warning",
      description:
        "Failing BTR rep (or missing Major Evidence) can force you onto Survivor path",
      note: "Be careful!",
    },
  },
  {
    id: "solar-savior",
    type: "story",
    data: {
      label: "Build Solar Power (mandatory)",
      description: "Hideout requirement",
    },
  },
  {
    id: "build-72-savior",
    type: "craft",
    data: {
      label: "72h build time",
      description: "Solar Power construction",
      isCraft: true,
      craftHours: 72,
    },
  },
  {
    id: "final-craft-savior",
    type: "craft",
    data: {
      label: "Final craft for the Keycard",
      description: "Prepare escape keycard",
      isCraft: true,
    },
  },

  // Savior ending sequence
  {
    id: "end-setup-savior",
    type: "story",
    data: {
      label: "Head to Shoreline (22:00 to 04:00)",
      description:
        "Intercom at Tower, swipe Keycard. Approach Terminal (no weapon in hand). Start escape attempt",
      note: "Final extraction sequence",
    },
  },
  {
    id: "fail-savior",
    type: "story",
    data: {
      label: "If attempt fails:",
      description: "Craft the Keycard again (11h), needs a new Blank RFID Card",
      isCraft: true,
      craftHours: 11,
    },
  },
  {
    id: "savior-ending",
    type: "ending",
    data: {
      label: "Savior Ending",
      description: "You escaped Tarkov as a Savior",
      endingType: "savior",
    },
  },

  // ==================== FALLEN PATH ====================
  {
    id: "enough",
    type: "achievement",
    data: {
      label: "Enough of your Games!",
      description: "Achievement Unlocked",
      note: "🏆 Achievement: Enough of your Games!",
    },
  },
  {
    id: "talk-prapor",
    type: "story",
    data: {
      label: "Talk to Prapor",
      description: "Discuss next steps",
    },
  },

  // Conditional branches based on earlier case decision
  {
    id: "case-back",
    type: "story",
    data: {
      label: "If you handed the case to Prapor earlier",
      description: "and got it back from Lightkeeper",
      note: "Shorter path",
    },
  },
  {
    id: "no-case-back",
    type: "story",
    data: {
      label: "If you did not hand the case to Prapor earlier",
      description: "Longer path required",
      note: "More requirements",
    },
  },

  // No case back path requirements
  {
    id: "repair-40",
    type: "story",
    data: {
      label: "Hand over 40 Repair Kits",
      description: "(100% durability, non-FIR)",
    },
  },
  {
    id: "secure-cont",
    type: "story",
    data: {
      label: "Hand over Gamma/Theta/Epsilon Secure Container",
      description: "Give up your secure container",
    },
  },
  {
    id: "military-50",
    type: "story",
    data: {
      label: "Hand over 50 Military Components",
      description: "(Virtex/COFDM/etc, non-FIR)",
    },
  },

  // Convergence for Fallen path
  {
    id: "bio-case",
    type: "story",
    data: {
      label: "Get the Bio Weapon Case (Reserve RB-PKPM?)",
      description: "Hand it over to Prapor",
    },
  },
  {
    id: "usd-1m",
    type: "story",
    data: {
      label: "Hand over 1M USD",
      description: "Payment to Prapor",
      cost: 1000000,
      currency: "usd",
      note: "1M USD",
    },
  },
  {
    id: "will-blow",
    type: "achievement",
    data: {
      label: "Will it Blow?",
      description: "Achievement Unlocked",
      note: "🏆 Achievement: Will it Blow?",
    },
  },
  {
    id: "tg-48c",
    type: "craft",
    data: {
      label: "48h timegate",
      description: "Wait for Prapor",
      isTimeGate: true,
      timeGateHours: 48,
    },
  },
  {
    id: "hash-usb",
    type: "story",
    data: {
      label: "Prapor gives you a USB stick with his Hash Code",
      description: "Key item received",
    },
  },
  {
    id: "solar-fallen",
    type: "story",
    data: {
      label: "Build Solar Power (mandatory)",
      description: "Hideout requirement",
    },
  },
  {
    id: "build-72-fallen",
    type: "craft",
    data: {
      label: "72h build time",
      description: "Solar Power construction",
      isCraft: true,
      craftHours: 72,
    },
  },
  {
    id: "final-craft-fallen",
    type: "craft",
    data: {
      label: "Final craft for the Keycard",
      description: "Prepare escape keycard",
      isCraft: true,
    },
  },

  // Fallen ending sequence
  {
    id: "end-setup-fallen",
    type: "story",
    data: {
      label: "Head to Shoreline (22:00 to 04:00)",
      description:
        "Intercom at Tower, swipe Keycard. Approach Terminal (no weapon in hand). Start escape attempt",
      note: "Final extraction sequence",
    },
  },
  {
    id: "fail-fallen",
    type: "story",
    data: {
      label: "If attempt fails:",
      description: "Craft the Keycard again (11h), needs a new Blank RFID Card",
      isCraft: true,
      craftHours: 11,
    },
  },
  {
    id: "fallen-ending",
    type: "ending",
    data: {
      label: "Fallen Ending",
      description: "You escaped Tarkov, but at what cost?",
      endingType: "fallen",
    },
  },

  // ==================== DEBTOR PATH ====================
  {
    id: "hand-2-major",
    type: "story",
    data: {
      label: "Hand 2 Major Evidence in to Kerman",
      description: "then stop working with him",
    },
  },
  {
    id: "u-turn",
    type: "achievement",
    data: {
      label: "U Turn",
      description: "Achievement Unlocked",
      note: "🏆 Achievement: U Turn",
    },
  },
  {
    id: "talk-lk",
    type: "story",
    data: {
      label: "Talk to Lightkeeper",
      description: "Switch allegiance",
    },
  },
  {
    id: "topo",
    type: "story",
    data: {
      label: "Find topographic recommendations (5 total)",
      description: "5 maps, 1 per map",
    },
  },
  {
    id: "tg-24b",
    type: "craft",
    data: {
      label: "6h Craft at Intel Centre",
      description: "Process the maps",
      isCraft: true,
      craftHours: 6,
    },
  },
  {
    id: "hash-drive",
    type: "story",
    data: {
      label: "Bring a special flash drive with Hashmail",
      description: "to Lightkeeper",
    },
  },
  {
    id: "kill-30",
    type: "story",
    data: {
      label: "Kill 30 PMCs on Woods",
      description: "and hand over 100 PMC dogtags",
    },
  },
  {
    id: "amulet",
    type: "story",
    data: {
      label: "Find Cultist Amulet in each Marked Room",
      description: "Collect all amulets",
    },
  },
  {
    id: "place",
    type: "story",
    data: {
      label: "Place all amulets at Shared Bedroom Marked Key",
      description: "on Lightkeeper Island",
    },
  },
  {
    id: "tg-48d",
    type: "craft",
    data: {
      label: "48h timegate",
      description: "Wait for Lightkeeper",
      isTimeGate: true,
      timeGateHours: 48,
    },
  },
  {
    id: "lk-key",
    type: "story",
    data: {
      label: "Lightkeeper hands you a Keycard for Terminal",
      description: "Key item received",
    },
  },

  // Debtor ending sequence
  {
    id: "end-setup-debtor",
    type: "story",
    data: {
      label: "Head to Shoreline (22:00 to 04:00)",
      description:
        "Intercom at Tower, swipe Keycard. Approach Terminal (no weapon in hand). Start escape attempt",
      note: "Final extraction sequence",
    },
  },
  {
    id: "fail-debtor",
    type: "story",
    data: {
      label: "If attempt fails:",
      description: "Barter a new keycard from Lightkeeper for 1 Blue Folder",
    },
  },
  {
    id: "debtor-ending",
    type: "ending",
    data: {
      label: "Debtor Ending",
      description: "You escaped Tarkov through Lightkeeper's debt",
      endingType: "debtor",
    },
  },
]);

// ============================================================================
// EDGES - Based on Mermaid flowchart connections
// ============================================================================

export const initialEdges: Edge[] = [
  // ==================== TOP: ARMORED CASE ====================
  // Title -> Recover
  {
    id: "e-title-recover",
    source: "title",
    target: "recover",
    style: { stroke: "#666" },
  },

  // Recover -> Keep/Give decision
  {
    id: "e-recover-keep",
    source: "recover",
    target: "keep-self",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-recover-give",
    source: "recover",
    target: "give-prapor-0",
    style: { stroke: "#ef4444" },
  },

  // Keep path -> Armored Hands (direct)
  {
    id: "e-keep-armored",
    source: "keep-self",
    target: "armored-hands",
    style: { stroke: "#3b82f6" },
  },

  // Give Prapor path (longer route to get case back)
  {
    id: "e-give-comp",
    source: "give-prapor-0",
    target: "prapor-comp",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-comp-lkaccess",
    source: "prapor-comp",
    target: "lk-access",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-lkaccess-talklk0",
    source: "lk-access",
    target: "talk-lk-0",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-talklk0-flare",
    source: "talk-lk-0",
    target: "yellow-flare",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-flare-kill15",
    source: "yellow-flare",
    target: "kill-15",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-kill15-lkcase",
    source: "kill-15",
    target: "lk-case",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-lkcase-armored",
    source: "lk-case",
    target: "armored-hands",
    style: { stroke: "#ef4444" },
  },

  // Armored Hands -> Open Case -> Craft -> Case Open
  {
    id: "e-armored-open",
    source: "armored-hands",
    target: "open-case",
    style: { stroke: "#666" },
  },
  {
    id: "e-open-tg48",
    source: "open-case",
    target: "tg-48",
    style: { stroke: "#666" },
  },
  {
    id: "e-tg48-caseopen",
    source: "tg-48",
    target: "case-open",
    style: { stroke: "#666" },
  },

  // ==================== SPLIT: Work with Kerman ====================
  {
    id: "e-caseopen-dontwork",
    source: "case-open",
    target: "dont-work",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-caseopen-worktogether",
    source: "case-open",
    target: "work-together",
    style: { stroke: "#f59e0b" },
  },

  // ==================== SURVIVOR PATH (Don't work with Kerman) ====================
  {
    id: "e-dontwork-slshore",
    source: "dont-work",
    target: "sl-shore",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-slshore-keyfail",
    source: "sl-shore",
    target: "sl-key-fail",
    style: { stroke: "#3b82f6" },
  },

  // Cost branches (parallel)
  {
    id: "e-keyfail-300",
    source: "sl-key-fail",
    target: "sl-300",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-keyfail-500",
    source: "sl-key-fail",
    target: "sl-500",
    style: { stroke: "#3b82f6" },
  },

  // 300M path (gave case to Prapor) -> direct to Note
  {
    id: "e-300-note",
    source: "sl-300",
    target: "sl-note",
    style: { stroke: "#ef4444" },
  },

  // 500M path (kept case) -> longer task chain
  {
    id: "e-500-tg",
    source: "sl-500",
    target: "sl-tg",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-tg-5",
    source: "sl-tg",
    target: "sl-5",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-5-flash",
    source: "sl-5",
    target: "sl-flash",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-flash-kill50",
    source: "sl-flash",
    target: "sl-kill-50",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-kill50-kill4",
    source: "sl-kill-50",
    target: "sl-kill-4",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-kill4-48",
    source: "sl-kill-4",
    target: "sl-48",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-48-note",
    source: "sl-48",
    target: "sl-note",
    style: { stroke: "#3b82f6" },
  },

  // Note -> Easy Way -> Ending sequence
  {
    id: "e-note-easy",
    source: "sl-note",
    target: "sl-easy",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-easy-endsetup",
    source: "sl-easy",
    target: "end-setup-survivor",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-endsetup-fail-survivor",
    source: "end-setup-survivor",
    target: "fail-survivor",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-fail-survivor-ending",
    source: "fail-survivor",
    target: "survivor-ending",
    style: { stroke: "#22c55e" },
  },

  // ==================== WORK TOGETHER PATH ====================
  {
    id: "e-worktogether-search",
    source: "work-together",
    target: "wt-search",
    style: { stroke: "#f59e0b" },
  },
  {
    id: "e-search-keycard",
    source: "wt-search",
    target: "wt-keycard",
    style: { stroke: "#f59e0b" },
  },
  {
    id: "e-keycard-tg24",
    source: "wt-keycard",
    target: "tg-24",
    style: { stroke: "#f59e0b" },
  },
  {
    id: "e-tg24-paymech",
    source: "tg-24",
    target: "wt-pay-mech",
    style: { stroke: "#f59e0b" },
  },
  {
    id: "e-paymech-elekt",
    source: "wt-pay-mech",
    target: "wt-elekt",
    style: { stroke: "#f59e0b" },
  },
  {
    id: "e-elekt-activate",
    source: "wt-elekt",
    target: "wt-activate",
    style: { stroke: "#f59e0b" },
  },
  {
    id: "e-activate-tg50",
    source: "wt-activate",
    target: "tg-50",
    style: { stroke: "#f59e0b" },
  },
  {
    id: "e-tg50-wtshore",
    source: "tg-50",
    target: "wt-shore",
    style: { stroke: "#f59e0b" },
  },

  // ==================== POST-SWIPE: 3 branches ====================
  {
    id: "e-wtshore-hksavior",
    source: "wt-shore",
    target: "hk-savior",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-wtshore-nkfallen",
    source: "wt-shore",
    target: "nk-fallen",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-wtshore-hkdebtor",
    source: "wt-shore",
    target: "hk-debtor",
    style: { stroke: "#a78bfa" },
  },

  // ==================== SAVIOR PATH ====================
  {
    id: "e-hksavior-audio",
    source: "hk-savior",
    target: "audio-note",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-audio-complete",
    source: "audio-note",
    target: "complete-all",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-complete-tg48b",
    source: "complete-all",
    target: "tg-48b",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-tg48b-trusted",
    source: "tg-48b",
    target: "trusted",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-trusted-fence4",
    source: "trusted",
    target: "fence-4",
    style: { stroke: "#22c55e" },
  },

  // PVP/PVE split
  {
    id: "e-fence4-pvp",
    source: "fence-4",
    target: "pvp",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-fence4-pve",
    source: "fence-4",
    target: "pve",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-pvp-coop",
    source: "pvp",
    target: "coop",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-pve-kill5",
    source: "pve",
    target: "kill-5-no-scav",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-kill5-btr",
    source: "kill-5-no-scav",
    target: "btr-04",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-coop-btr",
    source: "coop",
    target: "btr-04",
    style: { stroke: "#22c55e" },
  },

  // Warning connection (dashed)
  {
    id: "e-complete-warn",
    source: "complete-all",
    target: "warn-btr",
    style: { stroke: "#a78bfa", strokeDasharray: "5,5" },
  },
  {
    id: "e-btr-warn",
    source: "btr-04",
    target: "warn-btr",
    style: { stroke: "#a78bfa", strokeDasharray: "5,5" },
  },
  {
    id: "e-warn-slshore",
    source: "warn-btr",
    target: "sl-shore",
    style: { stroke: "#a78bfa", strokeDasharray: "5,5" },
  },

  // Continue Savior path
  {
    id: "e-btr-solar",
    source: "btr-04",
    target: "solar-savior",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-solar-build72",
    source: "solar-savior",
    target: "build-72-savior",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-build72-finalcraft",
    source: "build-72-savior",
    target: "final-craft-savior",
    style: { stroke: "#22c55e" },
  },

  // Savior ending sequence
  {
    id: "e-finalcraft-endsetup-savior",
    source: "final-craft-savior",
    target: "end-setup-savior",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-endsetup-fail-savior",
    source: "end-setup-savior",
    target: "fail-savior",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-fail-savior-ending",
    source: "fail-savior",
    target: "savior-ending",
    style: { stroke: "#22c55e" },
  },

  // ==================== FALLEN PATH ====================
  {
    id: "e-nkfallen-enough",
    source: "nk-fallen",
    target: "enough",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-enough-talkprapor",
    source: "enough",
    target: "talk-prapor",
    style: { stroke: "#ef4444" },
  },

  // Conditional branches
  {
    id: "e-talkprapor-caseback",
    source: "talk-prapor",
    target: "case-back",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-talkprapor-nocaseback",
    source: "talk-prapor",
    target: "no-case-back",
    style: { stroke: "#ef4444" },
  },

  // Case back path (shorter) -> Bio Case
  {
    id: "e-caseback-bio",
    source: "case-back",
    target: "bio-case",
    style: { stroke: "#ef4444" },
  },

  // No case back path (longer)
  {
    id: "e-nocaseback-repair",
    source: "no-case-back",
    target: "repair-40",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-repair-secure",
    source: "repair-40",
    target: "secure-cont",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-secure-military",
    source: "secure-cont",
    target: "military-50",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-military-bio",
    source: "military-50",
    target: "bio-case",
    style: { stroke: "#ef4444" },
  },

  // Convergence -> Bio Case onward
  {
    id: "e-bio-usd",
    source: "bio-case",
    target: "usd-1m",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-usd-willblow",
    source: "usd-1m",
    target: "will-blow",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-willblow-tg48c",
    source: "will-blow",
    target: "tg-48c",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-tg48c-hash",
    source: "tg-48c",
    target: "hash-usb",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-hash-solar-fallen",
    source: "hash-usb",
    target: "solar-fallen",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-solar-build72-fallen",
    source: "solar-fallen",
    target: "build-72-fallen",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-build72-finalcraft-fallen",
    source: "build-72-fallen",
    target: "final-craft-fallen",
    style: { stroke: "#ef4444" },
  },

  // Fallen ending sequence
  {
    id: "e-finalcraft-endsetup-fallen",
    source: "final-craft-fallen",
    target: "end-setup-fallen",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-endsetup-fail-fallen",
    source: "end-setup-fallen",
    target: "fail-fallen",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-fail-fallen-ending",
    source: "fail-fallen",
    target: "fallen-ending",
    style: { stroke: "#ef4444" },
  },

  // ==================== DEBTOR PATH ====================
  {
    id: "e-hkdebtor-hand2",
    source: "hk-debtor",
    target: "hand-2-major",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-hand2-uturn",
    source: "hand-2-major",
    target: "u-turn",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-uturn-talklk",
    source: "u-turn",
    target: "talk-lk",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-talklk-topo",
    source: "talk-lk",
    target: "topo",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-topo-tg24b",
    source: "topo",
    target: "tg-24b",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-tg24b-hashdrive",
    source: "tg-24b",
    target: "hash-drive",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-hashdrive-kill30",
    source: "hash-drive",
    target: "kill-30",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-kill30-amulet",
    source: "kill-30",
    target: "amulet",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-amulet-place",
    source: "amulet",
    target: "place",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-place-tg48d",
    source: "place",
    target: "tg-48d",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-tg48d-lkkey",
    source: "tg-48d",
    target: "lk-key",
    style: { stroke: "#a78bfa" },
  },

  // Debtor ending sequence
  {
    id: "e-lkkey-endsetup-debtor",
    source: "lk-key",
    target: "end-setup-debtor",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-endsetup-fail-debtor",
    source: "end-setup-debtor",
    target: "fail-debtor",
    style: { stroke: "#a78bfa" },
  },
  {
    id: "e-fail-debtor-ending",
    source: "fail-debtor",
    target: "debtor-ending",
    style: { stroke: "#a78bfa" },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find the path from the start node to a target node using BFS
 * Updated to handle multiple parents and branching paths
 */
export function findPathToNode(
  targetId: string,
  nodes: Node[],
  edges: Edge[]
): Node[] {
  // Build adjacency list (forward direction - from sources to targets)
  const adjacencyList = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = adjacencyList.get(edge.source) || [];
    adjacencyList.set(edge.source, [...existing, edge.target]);
  }

  // BFS from title to find the shortest path to target
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const startNode = nodes.find((n) => n.id === "title");
  if (!startNode) return [];

  const queue: { id: string; path: string[] }[] = [
    { id: "title", path: ["title"] },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id: current, path } = queue.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === targetId) {
      // Found the target - convert path to nodes
      return path
        .map((id) => nodeMap.get(id))
        .filter((n): n is Node => n !== undefined);
    }

    // Find all children of current node
    const children = adjacencyList.get(current) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        queue.push({
          id: child,
          path: [...path, child],
        });
      }
    }
  }

  // If no path found, return empty array
  return [];
}

/**
 * Get edge IDs that connect nodes in a path
 */
export function getPathEdgeIds(pathNodes: Node[], edges: Edge[]): Set<string> {
  const pathNodeIds = new Set(pathNodes.map((n) => n.id));
  const edgeIds = new Set<string>();

  for (const edge of edges) {
    if (pathNodeIds.has(edge.source) && pathNodeIds.has(edge.target)) {
      edgeIds.add(edge.id);
    }
  }

  return edgeIds;
}

/**
 * Calculate path breakdown with costs, crafts, and time gates
 */
export function getPathBreakdown(pathNodes: Node[]): PathBreakdown {
  let totalCostRoubles = 0;
  let totalCostBTC = 0;
  let totalCostUSD = 0;
  let totalCraftHours = 0;
  let totalTimeGateHours = 0;

  const steps: PathStep[] = pathNodes.map((node) => {
    const data = node.data as Record<string, unknown>;
    const cost = (data.cost as number) || 0;
    const currency = data.currency as PathStep["currency"] | undefined;
    const isCraft = data.isCraft as boolean;
    const craftHours = (data.craftHours as number) || 0;
    const isTimeGate = data.isTimeGate as boolean;
    const timeGateHours = (data.timeGateHours as number) || 0;

    if (cost > 0) {
      // Use explicit currency when specified, otherwise detect from note
      if (currency === "usd") {
        totalCostUSD += cost;
      } else if (currency === "btc") {
        totalCostBTC += cost;
      } else if (currency === "roubles") {
        totalCostRoubles += cost;
      } else {
        // Detect currency from note field for backward compatibility
        const note = (data.note as string) || "";
        if (note.includes("BTC") || note.includes("Bitcoin")) {
          totalCostBTC += cost;
        } else if (note.includes("USD") || note.includes("$")) {
          totalCostUSD += cost;
        } else if (note.includes("M ₽") || note.includes("₽")) {
          totalCostRoubles += cost;
        } else if (cost < 100) {
          // Legacy heuristic: small amounts are likely BTC
          totalCostBTC += cost;
        } else {
          // Default to roubles for large amounts
          totalCostRoubles += cost;
        }
      }
    }

    if (isCraft && craftHours) {
      totalCraftHours += craftHours;
    }

    if (isTimeGate && timeGateHours) {
      totalTimeGateHours += timeGateHours;
    }

    return {
      id: node.id,
      label: data.label as string,
      description: data.description as string | undefined,
      note: data.note as string | undefined,
      cost,
      currency,
      isCraft,
      craftHours,
      isTimeGate,
      timeGateHours,
    };
  });

  return {
    steps,
    totalCostRoubles,
    totalCostBTC,
    totalCostUSD,
    totalCraftHours,
    totalTimeGateHours,
  };
}
