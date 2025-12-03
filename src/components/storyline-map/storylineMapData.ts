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
  isCraft?: boolean;
  craftHours?: number;
  isTimeGate?: boolean;
  timeGateHours?: number;
}

export interface PathBreakdown {
  steps: PathStep[];
  totalCostRoubles: number;
  totalCostBTC: number;
  totalCraftHours: number;
  totalTimeGateHours: number;
}

// ============================================================================
// NODES (positions are custom-placed via UI)
// ============================================================================

export const initialNodes: Node[] = [
  // ==================== START ====================
  {
    id: "start",
    type: "story",
    position: { x: 949, y: -391 },
    data: {
      label: "Acquire Armored Case",
      description: "Find the Armored Case from PMC's crashed Plane",
    },
  },

  // ==================== INITIAL DECISION: Keep vs Give ====================
  {
    id: "case-decision",
    type: "decision",
    position: { x: 986, y: -265 },
    data: {
      label: "The Case?",
      description: "Choose your path",
      isIrreversible: true,
    },
  },

  // ==========================================================================
  // BRANCH 1: KEEP CASE (LEFT SIDE) - Common Setup
  // ==========================================================================
  {
    id: "keep-case",
    type: "story",
    position: { x: 327, y: 101 },
    data: {
      label: "Keep Case for Yourself",
      description: "Decision: Keep the case",
    },
  },
  {
    id: "1-open-case",
    type: "story",
    position: { x: 322, y: 199 },
    data: {
      label: "Open the Case",
      description: "Find Signal Jammer on Labs",
    },
  },
  {
    id: "1-craft-55h",
    type: "craft",
    position: { x: 325, y: 296 },
    data: {
      label: "55H Craft at Workbench",
      description: "Craft to unlock the case",
      isCraft: true,
      craftHours: 55,
    },
  },
  {
    id: "1-case-open",
    type: "story",
    position: { x: 326, y: 417 },
    data: {
      label: "Case is Open",
      description: "Case unlocked and ready",
    },
  },
  {
    id: "Kerman-decision-1",
    type: "decision",
    position: { x: 307, y: 511 },
    data: {
      label: "Work with Kerman?",
      description: "Choose to work with Kerman or go solo",
      isIrreversible: true,
    },
  },

  // ==========================================================================
  // PATH 1-A: KEEP CASE + DON'T WORK WITH Kerman → SURVIVOR ENDING
  // ==========================================================================
  {
    id: "1a-shoreline-keycard",
    type: "story",
    position: { x: -40, y: 716 },
    data: { label: "Shoreline Port Entrance", description: "Swipe Keycard at Intercom" },
  },
  {
    id: "1a-keycard-fail",
    type: "story",
    position: { x: -40, y: 801 },
    data: { label: "Keycard Failed", description: "Ask Prapor for Help" },
  },
  {
    id: "1a-pay-prapor",
    type: "story",
    position: { x: -41, y: 892 },
    data: { label: "Pay Prapor 500M Roubles", description: "Full price (kept the case)", cost: 500000000, note: "500M ₽ (no discount)" },
  },
  {
    id: "1a-find-folders",
    type: "story",
    position: { x: -41, y: 1050 },
    data: { label: "Find 4 Terragroup Folders", description: "Report Folders on Labs" },
  },
  {
    id: "1a-craft-5h",
    type: "craft",
    position: { x: -43, y: 1136 },
    data: { label: "5H Craft at Intel Center", description: "Process the data", isCraft: true, craftHours: 5 },
  },
  {
    id: "1a-give-flash",
    type: "story",
    position: { x: -41, y: 1228 },
    data: { label: "Give Prapor Flash Drive", description: "Hand over the data" },
  },
  {
    id: "1a-kill-50",
    type: "story",
    position: { x: -45, y: 1325 },
    data: { label: "Kill 50 Targets", description: "Any targets on Streets of Tarkov" },
  },
  {
    id: "1a-kill-4-pmcs",
    type: "story",
    position: { x: -41, y: 1426 },
    data: { label: "Kill 4 PMCs", description: "Single Raid and survive" },
  },
  {
    id: "1a-get-note",
    type: "story",
    position: { x: -41, y: 1524 },
    data: { label: "Get Note from Prapor", description: "Note for Terminal soldiers" },
  },
  {
    id: "1a-achievement-easy",
    type: "story",
    position: { x: -41, y: 1614 },
    data: { label: "Achievement Unlocked", description: "🏆 Easy Way", note: "🏆 Achievement: Easy Way" },
  },
  {
    id: "1a-shoreline-escape",
    type: "story",
    position: { x: -70, y: 1743 },
    data: { label: "Head to Shoreline", description: "22:00-04:00, Intercom at Tower, No weapon", note: "If fail: 5M ₽ for new Note (limit 2)" },
  },
  {
    id: "survivor-ending",
    type: "ending",
    position: { x: -38, y: 2881 },
    data: { label: "Survivor Ending", description: "You escaped Tarkov as a Survivor", endingType: "survivor" },
  },

  // ==========================================================================
  // PATH 1-B: KEEP CASE + WORK WITH Kerman
  // ==========================================================================
  {
    id: "1b-search-labs",
    type: "story",
    position: { x: 641, y: 703 },
    data: { label: "Search Labs", description: "Search for Masterkeycard and RFID Device" },
  },
  {
    id: "1b-keycard-acquired",
    type: "story",
    position: { x: 662, y: 795 },
    data: { label: "Keycard Acquired", description: "Device missing - talk to Mechanic" },
  },
  {
    id: "1b-pay-mechanic",
    type: "story",
    position: { x: 664, y: 875 },
    data: { label: "Pay Mechanic 40 Bitcoin", description: "Payment for services", cost: 40, note: "40 BTC" },
  },
  {
    id: "1b-get-rfid",
    type: "story",
    position: { x: 663, y: 1028 },
    data: { label: "Get RFID Device", description: "Elektroniks Apartment (Streets)" },
  },
  {
    id: "1b-activate-rfid",
    type: "story",
    position: { x: 663, y: 1120 },
    data: { label: "Activate RFID Card", description: "From Armored Case" },
  },
  {
    id: "1b-craft-50h",
    type: "craft",
    position: { x: 660, y: 1206 },
    data: { label: "50H Craft at Intel Center", description: "Prepare for Shoreline", isCraft: true, craftHours: 50 },
  },
  {
    id: "1b-shoreline-keycard",
    type: "story",
    position: { x: 658, y: 1296 },
    data: { label: "Shoreline Port Entrance", description: "Swipe Keycard at Intercom" },
  },
  {
    id: "Kerman-evidence-decision",
    type: "decision",
    position: { x: 657, y: 1384 },
    data: { label: "Help Kerman find Evidence?", description: "Choose your path to escape", isIrreversible: true },
  },

  // ==========================================================================
  // PATH 1-B1: HELP KERMAN (FENCE PATH) → SAVIOR ENDING
  // ==========================================================================
  {
    id: "1b1-help-evidence",
    type: "story",
    position: { x: 303, y: 1598 },
    data: { label: "Help Kerman find Evidence", description: "On Terragroup" },
  },
  {
    id: "1b1-complete-chapters",
    type: "story",
    position: { x: 273, y: 1692 },
    data: { label: "Complete Story Chapters", description: "Complete every other chapter, hand in evidence" },
  },
  {
    id: "1b1-fence-contact",
    type: "story",
    position: { x: 296, y: 1804 },
    data: { label: "Kerman's Contact (Fence)", description: "Fence reaches out" },
  },
  {
    id: "1b1-fence-rep",
    type: "story",
    position: { x: 293, y: 1904 },
    data: { label: "Get 4.0 Fence Rep", description: "Raise Fence reputation" },
  },
  {
    id: "1b1-pvp-pve-task",
    type: "story",
    position: { x: 249, y: 2019 },
    data: { label: "PvP/PvE Task", description: "PvP: Co-Op Extract with Scav (Woods/Reserve)\nPvE: Kill 5 PMCs w/o killing Scavs" },
  },
  {
    id: "1b1-btr-rep",
    type: "story",
    position: { x: 263, y: 2168 },
    data: { label: "BTR Driver 0.4 Rep", description: "Complete 'The Price of Independence'" },
  },
  {
    id: "1b1-solar-power",
    type: "story",
    position: { x: 270, y: 2282 },
    data: { label: "Build Solar Power", description: "Hideout upgrade", isCraft: true },
  },
  {
    id: "1b1-final-craft",
    type: "story",
    position: { x: 269, y: 2379 },
    data: { label: "Final Keycard Craft", description: "Craft the escape keycard", isCraft: true },
  },
  {
    id: "1b1-shoreline-escape",
    type: "story",
    position: { x: 242, y: 2514 },
    data: { label: "Head to Shoreline", description: "22:00-04:00, Intercom at Tower, No weapon", note: "If fail: 11H craft + new Blank RFID Card" },
  },
  {
    id: "savior-ending",
    type: "ending",
    position: { x: 258, y: 2881 },
    data: { label: "Savior Ending", description: "You escaped as a Savior with Kerman", endingType: "savior" },
  },

  // ==========================================================================
  // PATH 1-B2: DON'T HELP (PRAPOR HARD MODE) → FALLEN ENDING (WIP)
  // ==========================================================================
  {
    id: "1b2-no-help-prapor",
    type: "story",
    position: { x: 634, y: 1634 },
    data: { label: "Don't Help Kerman", description: "Talk to Prapor (only if LK not unlocked)", note: "🏆 Achievement: Enough of your Games!" },
  },
  {
    id: "1b2-repair-kits",
    type: "story",
    position: { x: 650, y: 1751 },
    data: { label: "Hand Over 40 Repair Kits", description: "100% Durability, Non-FIR" },
  },
  {
    id: "1b2-secure-container",
    type: "story",
    position: { x: 642, y: 1843 },
    data: { label: "Hand Over Secure Container", description: "Kappa, Theta, or Epsilon" },
  },
  {
    id: "1b2-mil-components",
    type: "story",
    position: { x: 621, y: 1950 },
    data: { label: "Hand Over 50 Military Components", description: "Virtex, COFDM, etc. (Non-FIR)" },
  },
  {
    id: "1b2-bio-weapon",
    type: "story",
    position: { x: 649, y: 2041 },
    data: { label: "Get Bio Weapon Case", description: "Reserve RB-PKPTS", note: "🏆 Achievement: Will it Blow" },
  },
  {
    id: "1b2-pay-usd",
    type: "story",
    position: { x: 652, y: 2163 },
    data: { label: "Hand Over 1 Million USD", description: "Final payment", cost: 1000000, note: "1M USD" },
  },
  {
    id: "1b2-shoreline-escape",
    type: "story",
    position: { x: 638, y: 2751 },
    data: { label: "Head to Shoreline", description: "⚠️ Path still being worked on", note: "⚠️ WIP - may not be 100% accurate" },
  },
  {
    id: "fallen-ending",
    type: "ending",
    position: { x: 660, y: 2878 },
    data: { label: "Fallen Ending", description: "You fell from grace (WIP)", endingType: "fallen" },
  },

  // ==========================================================================
  // PATH 1-B3: DON'T HELP (LIGHTKEEPER PATH) → DEBTOR ENDING
  // ==========================================================================
  {
    id: "1b3-no-help-lk",
    type: "story",
    position: { x: 998, y: 1539 },
    data: { label: "Don't Help Kerman", description: "Talk to Lightkeeper", note: "🏆 Achievement: U Turn" },
  },
  {
    id: "1b3-topo-recon",
    type: "story",
    position: { x: 998, y: 1656 },
    data: { label: "Find 5 Topographic Recon", description: "5 different maps, 1 per map" },
  },
  {
    id: "1b3-craft-6h",
    type: "craft",
    position: { x: 998, y: 1757 },
    data: { label: "6H Craft at Intel Center", description: "Process the data", isCraft: true, craftHours: 6 },
  },
  {
    id: "1b3-flash-drive",
    type: "story",
    position: { x: 997, y: 1854 },
    data: { label: "Bring Flash Drive to LK", description: "Special Flash Drive with material" },
  },
  {
    id: "1b3-kill-30-pmcs",
    type: "story",
    position: { x: 997, y: 1951 },
    data: { label: "Kill 30 PMCs on Woods", description: "Hand over 100 PMC Dogtags" },
  },
  {
    id: "1b3-cultist-amulets",
    type: "story",
    position: { x: 996, y: 2041 },
    data: { label: "Find Cultist Amulets", description: "One in each Marked Room" },
  },
  {
    id: "1b3-place-amulets",
    type: "story",
    position: { x: 968, y: 2134 },
    data: { label: "Place Amulets", description: "Shared Bedroom Marked Key on LK Island" },
  },
  {
    id: "1b3-get-keycard",
    type: "story",
    position: { x: 974, y: 2224 },
    data: { label: "Get Keycard from LK", description: "Lightkeeper hands you Terminal keycard" },
  },
  {
    id: "1b3-shoreline-escape",
    type: "story",
    position: { x: 966, y: 2327 },
    data: { label: "Head to Shoreline", description: "22:00-04:00, Intercom at Tower, No weapon", note: "If fail: Barter 1 Blue Folder from LK" },
  },
  {
    id: "debtor-ending",
    type: "ending",
    position: { x: 982, y: 2876 },
    data: { label: "Debtor Ending", description: "You escaped as Lightkeeper's Debtor", endingType: "debtor" },
  },

  // ==========================================================================
  // BRANCH 2: GIVE CASE TO PRAPOR (HARDCORE PATH)
  // ==========================================================================
  {
    id: "give-prapor",
    type: "story",
    position: { x: 1605, y: 2 },
    data: { label: "Hand Over Case to Prapor", description: "Decision: Give the case to Prapor" },
  },
  {
    id: "2-find-compromat",
    type: "story",
    position: { x: 1604, y: 97 },
    data: { label: "Find Compromising Material", description: "On Prapor in Lighthouse" },
  },
  {
    id: "2-lk-access",
    type: "story",
    position: { x: 1611, y: 191 },
    data: { label: "Get Lightkeeper Access", description: "Gain access to Lightkeeper" },
  },
  {
    id: "2-talk-lk",
    type: "story",
    position: { x: 1601, y: 292 },
    data: { label: "Talk to Lightkeeper", description: "Hand over 3 TerraGroup Blue Folders", note: "3 Blue Folders" },
  },
  {
    id: "2-fire-flare",
    type: "story",
    position: { x: 1606, y: 428 },
    data: { label: "Fire Yellow Flare", description: "In front of Ultra Mall (Interchange)" },
  },
  {
    id: "2-kill-15",
    type: "story",
    position: { x: 1606, y: 532 },
    data: { label: "Kill 15 Targets", description: "Without dying (One Raid) on Streets" },
  },
  {
    id: "2-signal-jammer",
    type: "story",
    position: { x: 1619, y: 631 },
    data: { label: "Open the Case", description: "Find Signal Jammer on Labs" },
  },
  {
    id: "2-craft-55h",
    type: "craft",
    position: { x: 1619, y: 728 },
    data: { label: "55H Craft at Workbench", description: "Craft to unlock the case", isCraft: true, craftHours: 55 },
  },
  {
    id: "2-case-open",
    type: "story",
    position: { x: 1620, y: 854 },
    data: { label: "Case is Open", description: "Case unlocked and ready" },
  },
  {
    id: "Kerman-decision-2",
    type: "decision",
    position: { x: 1601, y: 940 },
    data: { label: "Work with Kerman?", description: "Choose to work with Kerman or go solo", isIrreversible: true },
  },

  // ==========================================================================
  // PATH 2-A: PRAPOR + DON'T WORK WITH Kerman → SURVIVOR ENDING
  // ==========================================================================
  {
    id: "2a-shoreline-keycard",
    type: "story",
    position: { x: 1600, y: 1177 },
    data: { label: "Shoreline Port Entrance", description: "Swipe Keycard at Intercom" },
  },
  {
    id: "2a-keycard-fail",
    type: "story",
    position: { x: 1603, y: 1271 },
    data: { label: "Keycard Failed", description: "Ask Prapor for Help" },
  },
  {
    id: "2a-pay-prapor",
    type: "story",
    position: { x: 1597, y: 1370 },
    data: { label: "Pay Prapor 300M Roubles", description: "Discounted from 500M (gave Case)", cost: 300000000, note: "300M ₽ (discounted)" },
  },
  {
    id: "2a-find-folders",
    type: "story",
    position: { x: 1605, y: 1539 },
    data: { label: "Find 4 Terragroup Folders", description: "Report Folders on Labs" },
  },
  {
    id: "2a-craft-5h",
    type: "craft",
    position: { x: 1603, y: 1624 },
    data: { label: "5H Craft at Intel Center", description: "Process the data", isCraft: true, craftHours: 5 },
  },
  {
    id: "2a-give-flash",
    type: "story",
    position: { x: 1592, y: 1711 },
    data: { label: "Give Prapor Flash Drive", description: "Hand over the data", note: "72h bonus: 'I am Speed' achievement" },
  },
  {
    id: "2a-kill-50",
    type: "story",
    position: { x: 1601, y: 1824 },
    data: { label: "Kill 50 Targets", description: "Any targets on Streets of Tarkov" },
  },
  {
    id: "2a-kill-4-pmcs",
    type: "story",
    position: { x: 1601, y: 1913 },
    data: { label: "Kill 4 PMCs", description: "Single Raid and survive" },
  },
  {
    id: "2a-get-note",
    type: "story",
    position: { x: 1600, y: 2000 },
    data: { label: "Get Note from Prapor", description: "Note for Terminal soldiers" },
  },
  {
    id: "2a-achievement-easy",
    type: "story",
    position: { x: 1600, y: 2100 },
    data: { label: "Achievement Unlocked", description: "🏆 Easy Way", note: "🏆 Achievement: Easy Way" },
  },
  {
    id: "2a-shoreline-escape",
    type: "story",
    position: { x: 1569, y: 2245 },
    data: { label: "Head to Shoreline", description: "22:00-04:00, Intercom at Tower, No weapon", note: "If fail: 5M ₽ for new Note (limit 2)" },
  },
  {
    id: "survivor-ending-2",
    type: "ending",
    position: { x: 1578, y: 2865 },
    data: { label: "Survivor Ending", description: "You escaped Tarkov as a Survivor (Prapor path)", endingType: "survivor" },
  },

  // ==========================================================================
  // PATH 2-B: PRAPOR + WORK WITH Kerman → EXILE ENDING (ALTERNATE)
  // ==========================================================================
  {
    id: "2b-meet-Kerman",
    type: "story",
    position: { x: 1918, y: 1097 },
    data: { label: "Meet Kerman at Safehouse", description: "Hand over RFID Device on Labs" },
  },
  {
    id: "2b-keycard",
    type: "story",
    position: { x: 1921, y: 1180 },
    data: { label: "Keycard Acquired", description: "Obtain access keycard" },
  },
  {
    id: "2b-pay-mechanic",
    type: "story",
    position: { x: 1917, y: 1267 },
    data: { label: "Pay Mechanic 40 Bitcoin", description: "Payment for services", cost: 40, note: "40 BTC" },
  },
  {
    id: "2b-get-rfid",
    type: "story",
    position: { x: 1918, y: 1417 },
    data: { label: "Get RFID Device", description: "Elektroniks Apartment (Streets)" },
  },
  {
    id: "2b-activate-rfid",
    type: "story",
    position: { x: 1920, y: 1500 },
    data: { label: "Activate RFID Card", description: "From Armored Case" },
  },
  {
    id: "2b-craft-50h",
    type: "craft",
    position: { x: 1920, y: 1600 },
    data: { label: "50H Craft at Intel Center", description: "Prepare for Shoreline", isCraft: true, craftHours: 50 },
  },
  {
    id: "2b-shoreline-keycard",
    type: "story",
    position: { x: 1920, y: 1700 },
    data: { label: "Shoreline Port Entrance", description: "Swipe Keycard at Intercom" },
  },
  {
    id: "2b-Kerman-decision",
    type: "decision",
    position: { x: 1921, y: 1793 },
    data: { label: "Help Kerman find Evidence?", description: "Choose your path to escape", isIrreversible: true },
  },

  // ==========================================================================
  // PATH 2-B1: HELP KERMAN (FENCE PATH) → SAVIOR ENDING
  // ==========================================================================
  {
    id: "2b1-help-evidence",
    type: "story",
    position: { x: 1914, y: 1963 },
    data: { label: "Help Kerman find Evidence", description: "On Terragroup" },
  },
  {
    id: "2b1-complete-chapters",
    type: "story",
    position: { x: 1887, y: 2044 },
    data: { label: "Complete Story Chapters", description: "Complete every other chapter, hand in evidence" },
  },
  {
    id: "2b1-fence-contact",
    type: "story",
    position: { x: 1917, y: 2147 },
    data: { label: "Kerman's Contact (Fence)", description: "Fence reaches out" },
  },
  {
    id: "2b1-fence-rep",
    type: "story",
    position: { x: 1919, y: 2234 },
    data: { label: "Get 4.0 Fence Rep", description: "Raise Fence reputation" },
  },
  {
    id: "2b1-pvp-pve-task",
    type: "story",
    position: { x: 1894, y: 2314 },
    data: { label: "PvP/PvE Task", description: "PvP: Co-Op Extract with Scav (Woods/Reserve)\nPvE: Kill 5 PMCs w/o killing Scavs" },
  },
  {
    id: "2b1-btr-rep",
    type: "story",
    position: { x: 1909, y: 2435 },
    data: { label: "BTR Driver 0.4 Rep", description: "Complete 'The Price of Independence'" },
  },
  {
    id: "2b1-solar-power",
    type: "story",
    position: { x: 1927, y: 2525 },
    data: { label: "Build Solar Power", description: "Hideout upgrade", isCraft: true },
  },
  {
    id: "2b1-final-craft",
    type: "story",
    position: { x: 1926, y: 2605 },
    data: { label: "Final Keycard Craft", description: "Craft the escape keycard", isCraft: true },
  },
  {
    id: "2b1-shoreline-escape",
    type: "story",
    position: { x: 1894, y: 2712 },
    data: { label: "Head to Shoreline", description: "22:00-04:00, Intercom at Tower, No weapon", note: "If fail: 11H craft + new Blank RFID Card" },
  },
  {
    id: "savior-ending-2",
    type: "ending",
    position: { x: 1904, y: 2870 },
    data: { label: "Savior Ending", description: "You escaped as a Savior with Kerman (Prapor path)", endingType: "savior" },
  },

  // ==========================================================================
  // PATH 2-B3: DON'T HELP (LIGHTKEEPER PATH) → DEBTOR ENDING
  // ==========================================================================
  {
    id: "2b3-no-help-lk",
    type: "story",
    position: { x: 2304, y: 2025 },
    data: { label: "Don't Help Kerman", description: "Talk to Lightkeeper", note: "🏆 Achievement: U Turn" },
  },
  {
    id: "2b3-topo-recon",
    type: "story",
    position: { x: 2305, y: 2144 },
    data: { label: "Find 5 Topographic Recon", description: "5 different maps, 1 per map" },
  },
  {
    id: "2b3-craft-6h",
    type: "craft",
    position: { x: 2306, y: 2237 },
    data: { label: "6H Craft at Intel Center", description: "Process the data", isCraft: true, craftHours: 6 },
  },
  {
    id: "2b3-flash-drive",
    type: "story",
    position: { x: 2304, y: 2329 },
    data: { label: "Bring Flash Drive to LK", description: "Special Flash Drive with material" },
  },
  {
    id: "2b3-kill-30-pmcs",
    type: "story",
    position: { x: 2305, y: 2427 },
    data: { label: "Kill 30 PMCs on Woods", description: "Hand over 100 PMC Dogtags" },
  },
  {
    id: "2b3-cultist-amulets",
    type: "story",
    position: { x: 2306, y: 2510 },
    data: { label: "Find Cultist Amulets", description: "One in each Marked Room" },
  },
  {
    id: "2b3-place-amulets",
    type: "story",
    position: { x: 2285, y: 2590 },
    data: { label: "Place Amulets", description: "Shared Bedroom Marked Key on LK Island" },
  },
  {
    id: "2b3-get-keycard",
    type: "story",
    position: { x: 2288, y: 2669 },
    data: { label: "Get Keycard from LK", description: "Lightkeeper hands you Terminal keycard" },
  },
  {
    id: "2b3-shoreline-escape",
    type: "story",
    position: { x: 2279, y: 2750 },
    data: { label: "Head to Shoreline", description: "22:00-04:00, Intercom at Tower, No weapon", note: "If fail: Barter 1 Blue Folder from LK" },
  },
  {
    id: "debtor-ending-2",
    type: "ending",
    position: { x: 2292, y: 2871 },
    data: { label: "Debtor Ending", description: "You escaped as Lightkeeper's Debtor (Prapor path)", endingType: "debtor" },
  },
];

// ============================================================================
// EDGES
// ============================================================================

export const initialEdges: Edge[] = [
  // ==================== START → INITIAL DECISION ====================
  { id: "e-start-decision", source: "start", target: "case-decision", style: { stroke: "#666" } },

  // ==================== INITIAL DECISION BRANCHES ====================
  { id: "e-decision-keep", source: "case-decision", target: "keep-case", label: "Keep Case", style: { stroke: "#3b82f6" } },
  { id: "e-decision-give", source: "case-decision", target: "give-prapor", label: "Give to Prapor", style: { stroke: "#ef4444" } },

  // ==================== BRANCH 1: KEEP CASE PATH (Common Setup) ====================
  { id: "e-keep-open", source: "keep-case", target: "1-open-case", style: { stroke: "#3b82f6" } },
  { id: "e-open-craft", source: "1-open-case", target: "1-craft-55h", style: { stroke: "#3b82f6" } },
  { id: "e-craft-open", source: "1-craft-55h", target: "1-case-open", style: { stroke: "#3b82f6" } },
  { id: "e-open-Kerman1", source: "1-case-open", target: "Kerman-decision-1", style: { stroke: "#3b82f6" } },

  // ==================== Kerman DECISION 1 BRANCHES ====================
  { id: "e-Kerman1-solo", source: "Kerman-decision-1", target: "1a-shoreline-keycard", label: "Don't work with Kerman", style: { stroke: "#22c55e" } },
  { id: "e-Kerman1-work", source: "Kerman-decision-1", target: "1b-search-labs", label: "Work together", style: { stroke: "#f59e0b" } },

  // ==================== PATH 1-A: SURVIVOR PATH ====================
  { id: "e-1a-1", source: "1a-shoreline-keycard", target: "1a-keycard-fail", style: { stroke: "#22c55e" } },
  { id: "e-1a-2", source: "1a-keycard-fail", target: "1a-pay-prapor", style: { stroke: "#22c55e" } },
  { id: "e-1a-3", source: "1a-pay-prapor", target: "1a-find-folders", style: { stroke: "#22c55e" } },
  { id: "e-1a-4", source: "1a-find-folders", target: "1a-craft-5h", style: { stroke: "#22c55e" } },
  { id: "e-1a-5", source: "1a-craft-5h", target: "1a-give-flash", style: { stroke: "#22c55e" } },
  { id: "e-1a-6", source: "1a-give-flash", target: "1a-kill-50", style: { stroke: "#22c55e" } },
  { id: "e-1a-7", source: "1a-kill-50", target: "1a-kill-4-pmcs", style: { stroke: "#22c55e" } },
  { id: "e-1a-8", source: "1a-kill-4-pmcs", target: "1a-get-note", style: { stroke: "#22c55e" } },
  { id: "e-1a-9", source: "1a-get-note", target: "1a-achievement-easy", style: { stroke: "#22c55e" } },
  { id: "e-1a-10", source: "1a-achievement-easy", target: "1a-shoreline-escape", style: { stroke: "#22c55e" } },
  { id: "e-1a-ending", source: "1a-shoreline-escape", target: "survivor-ending", style: { stroke: "#22c55e" } },

  // ==================== PATH 1-B: WORK WITH Kerman ====================
  { id: "e-1b-1", source: "1b-search-labs", target: "1b-keycard-acquired", style: { stroke: "#f59e0b" } },
  { id: "e-1b-2", source: "1b-keycard-acquired", target: "1b-pay-mechanic", style: { stroke: "#f59e0b" } },
  { id: "e-1b-3", source: "1b-pay-mechanic", target: "1b-get-rfid", style: { stroke: "#f59e0b" } },
  { id: "e-1b-4", source: "1b-get-rfid", target: "1b-activate-rfid", style: { stroke: "#f59e0b" } },
  { id: "e-1b-5", source: "1b-activate-rfid", target: "1b-craft-50h", style: { stroke: "#f59e0b" } },
  { id: "e-1b-6", source: "1b-craft-50h", target: "1b-shoreline-keycard", style: { stroke: "#f59e0b" } },
  { id: "e-1b-7", source: "1b-shoreline-keycard", target: "Kerman-evidence-decision", style: { stroke: "#f59e0b" } },

  // ==================== Kerman EVIDENCE DECISION BRANCHES ====================
  { id: "e-evidence-help", source: "Kerman-evidence-decision", target: "1b1-help-evidence", label: "Help Kerman", style: { stroke: "#22c55e" } },
  { id: "e-evidence-prapor", source: "Kerman-evidence-decision", target: "1b2-no-help-prapor", label: "Prapor (if no LK)", style: { stroke: "#6b7280" } },
  { id: "e-evidence-lk", source: "Kerman-evidence-decision", target: "1b3-no-help-lk", label: "Lightkeeper", style: { stroke: "#8b5cf6" } },

  // ==================== PATH 1-B1: SAVIOR (FENCE PATH) ====================
  { id: "e-1b1-1", source: "1b1-help-evidence", target: "1b1-complete-chapters", style: { stroke: "#22c55e" } },
  { id: "e-1b1-2", source: "1b1-complete-chapters", target: "1b1-fence-contact", style: { stroke: "#22c55e" } },
  { id: "e-1b1-3", source: "1b1-fence-contact", target: "1b1-fence-rep", style: { stroke: "#22c55e" } },
  { id: "e-1b1-4", source: "1b1-fence-rep", target: "1b1-pvp-pve-task", style: { stroke: "#22c55e" } },
  { id: "e-1b1-5", source: "1b1-pvp-pve-task", target: "1b1-btr-rep", style: { stroke: "#22c55e" } },
  { id: "e-1b1-6", source: "1b1-btr-rep", target: "1b1-solar-power", style: { stroke: "#22c55e" } },
  { id: "e-1b1-7", source: "1b1-solar-power", target: "1b1-final-craft", style: { stroke: "#22c55e" } },
  { id: "e-1b1-8", source: "1b1-final-craft", target: "1b1-shoreline-escape", style: { stroke: "#22c55e" } },
  { id: "e-1b1-ending", source: "1b1-shoreline-escape", target: "savior-ending", style: { stroke: "#22c55e" } },

  // ==================== PATH 1-B2: FALLEN (PRAPOR HARD MODE - WIP) ====================
  { id: "e-1b2-1", source: "1b2-no-help-prapor", target: "1b2-repair-kits", style: { stroke: "#6b7280" } },
  { id: "e-1b2-2", source: "1b2-repair-kits", target: "1b2-secure-container", style: { stroke: "#6b7280" } },
  { id: "e-1b2-3", source: "1b2-secure-container", target: "1b2-mil-components", style: { stroke: "#6b7280" } },
  { id: "e-1b2-4", source: "1b2-mil-components", target: "1b2-bio-weapon", style: { stroke: "#6b7280" } },
  { id: "e-1b2-5", source: "1b2-bio-weapon", target: "1b2-pay-usd", style: { stroke: "#6b7280" } },
  { id: "e-1b2-6", source: "1b2-pay-usd", target: "1b2-shoreline-escape", style: { stroke: "#6b7280" } },
  { id: "e-1b2-ending", source: "1b2-shoreline-escape", target: "fallen-ending", style: { stroke: "#6b7280" } },

  // ==================== PATH 1-B3: DEBTOR (LIGHTKEEPER PATH) ====================
  { id: "e-1b3-1", source: "1b3-no-help-lk", target: "1b3-topo-recon", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-2", source: "1b3-topo-recon", target: "1b3-craft-6h", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-3", source: "1b3-craft-6h", target: "1b3-flash-drive", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-4", source: "1b3-flash-drive", target: "1b3-kill-30-pmcs", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-5", source: "1b3-kill-30-pmcs", target: "1b3-cultist-amulets", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-6", source: "1b3-cultist-amulets", target: "1b3-place-amulets", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-7", source: "1b3-place-amulets", target: "1b3-get-keycard", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-8", source: "1b3-get-keycard", target: "1b3-shoreline-escape", style: { stroke: "#8b5cf6" } },
  { id: "e-1b3-ending", source: "1b3-shoreline-escape", target: "debtor-ending", style: { stroke: "#8b5cf6" } },

  // ==================== BRANCH 2: PRAPOR PATH ====================
  { id: "e-prapor-1", source: "give-prapor", target: "2-find-compromat", style: { stroke: "#ef4444" } },
  { id: "e-prapor-2", source: "2-find-compromat", target: "2-lk-access", style: { stroke: "#ef4444" } },
  { id: "e-prapor-3", source: "2-lk-access", target: "2-talk-lk", style: { stroke: "#ef4444" } },
  { id: "e-prapor-4", source: "2-talk-lk", target: "2-fire-flare", style: { stroke: "#ef4444" } },
  { id: "e-prapor-5", source: "2-fire-flare", target: "2-kill-15", style: { stroke: "#ef4444" } },
  { id: "e-prapor-6", source: "2-kill-15", target: "2-signal-jammer", style: { stroke: "#ef4444" } },
  { id: "e-prapor-7", source: "2-signal-jammer", target: "2-craft-55h", style: { stroke: "#ef4444" } },
  { id: "e-prapor-8", source: "2-craft-55h", target: "2-case-open", style: { stroke: "#ef4444" } },
  { id: "e-prapor-9", source: "2-case-open", target: "Kerman-decision-2", style: { stroke: "#ef4444" } },

  // ==================== Kerman DECISION 2 BRANCHES ====================
  { id: "e-Kerman2-solo", source: "Kerman-decision-2", target: "2a-shoreline-keycard", label: "Don't work with Kerman", style: { stroke: "#22c55e" } },
  { id: "e-Kerman2-work", source: "Kerman-decision-2", target: "2b-meet-Kerman", label: "Work together", style: { stroke: "#a855f7" } },

  // ==================== PATH 2-A: SURVIVOR PATH ====================
  { id: "e-2a-1", source: "2a-shoreline-keycard", target: "2a-keycard-fail", style: { stroke: "#22c55e" } },
  { id: "e-2a-2", source: "2a-keycard-fail", target: "2a-pay-prapor", style: { stroke: "#22c55e" } },
  { id: "e-2a-3", source: "2a-pay-prapor", target: "2a-find-folders", style: { stroke: "#22c55e" } },
  { id: "e-2a-4", source: "2a-find-folders", target: "2a-craft-5h", style: { stroke: "#22c55e" } },
  { id: "e-2a-5", source: "2a-craft-5h", target: "2a-give-flash", style: { stroke: "#22c55e" } },
  { id: "e-2a-6", source: "2a-give-flash", target: "2a-kill-50", style: { stroke: "#22c55e" } },
  { id: "e-2a-7", source: "2a-kill-50", target: "2a-kill-4-pmcs", style: { stroke: "#22c55e" } },
  { id: "e-2a-8", source: "2a-kill-4-pmcs", target: "2a-get-note", style: { stroke: "#22c55e" } },
  { id: "e-2a-9", source: "2a-get-note", target: "2a-achievement-easy", style: { stroke: "#22c55e" } },
  { id: "e-2a-10", source: "2a-achievement-easy", target: "2a-shoreline-escape", style: { stroke: "#22c55e" } },
  { id: "e-2a-ending", source: "2a-shoreline-escape", target: "survivor-ending-2", style: { stroke: "#22c55e" } },

  // ==================== PATH 2-B: WORK WITH KERMAN (COMMON) ====================
  { id: "e-2b-1", source: "2b-meet-Kerman", target: "2b-keycard", style: { stroke: "#a855f7" } },
  { id: "e-2b-2", source: "2b-keycard", target: "2b-pay-mechanic", style: { stroke: "#a855f7" } },
  { id: "e-2b-3", source: "2b-pay-mechanic", target: "2b-get-rfid", style: { stroke: "#a855f7" } },
  { id: "e-2b-4", source: "2b-get-rfid", target: "2b-activate-rfid", style: { stroke: "#a855f7" } },
  { id: "e-2b-5", source: "2b-activate-rfid", target: "2b-craft-50h", style: { stroke: "#a855f7" } },
  { id: "e-2b-6", source: "2b-craft-50h", target: "2b-shoreline-keycard", style: { stroke: "#a855f7" } },
  { id: "e-2b-7", source: "2b-shoreline-keycard", target: "2b-Kerman-decision", style: { stroke: "#a855f7" } },

  // ==================== KERMAN DECISION 2B BRANCHES ====================
  { id: "e-2b-Kerman-help", source: "2b-Kerman-decision", target: "2b1-help-evidence", label: "Help Kerman", style: { stroke: "#22c55e" } },
  { id: "e-2b-Kerman-no-help", source: "2b-Kerman-decision", target: "2b3-no-help-lk", label: "Don't help", style: { stroke: "#8b5cf6" } },

  // ==================== PATH 2-B1: SAVIOR (FENCE PATH) ====================
  { id: "e-2b1-1", source: "2b1-help-evidence", target: "2b1-complete-chapters", style: { stroke: "#22c55e" } },
  { id: "e-2b1-2", source: "2b1-complete-chapters", target: "2b1-fence-contact", style: { stroke: "#22c55e" } },
  { id: "e-2b1-3", source: "2b1-fence-contact", target: "2b1-fence-rep", style: { stroke: "#22c55e" } },
  { id: "e-2b1-4", source: "2b1-fence-rep", target: "2b1-pvp-pve-task", style: { stroke: "#22c55e" } },
  { id: "e-2b1-5", source: "2b1-pvp-pve-task", target: "2b1-btr-rep", style: { stroke: "#22c55e" } },
  { id: "e-2b1-6", source: "2b1-btr-rep", target: "2b1-solar-power", style: { stroke: "#22c55e" } },
  { id: "e-2b1-7", source: "2b1-solar-power", target: "2b1-final-craft", style: { stroke: "#22c55e" } },
  { id: "e-2b1-8", source: "2b1-final-craft", target: "2b1-shoreline-escape", style: { stroke: "#22c55e" } },
  { id: "e-2b1-ending", source: "2b1-shoreline-escape", target: "savior-ending-2", style: { stroke: "#22c55e" } },

  // ==================== PATH 2-B3: DEBTOR (LIGHTKEEPER PATH) ====================
  { id: "e-2b3-1", source: "2b3-no-help-lk", target: "2b3-topo-recon", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-2", source: "2b3-topo-recon", target: "2b3-craft-6h", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-3", source: "2b3-craft-6h", target: "2b3-flash-drive", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-4", source: "2b3-flash-drive", target: "2b3-kill-30-pmcs", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-5", source: "2b3-kill-30-pmcs", target: "2b3-cultist-amulets", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-6", source: "2b3-cultist-amulets", target: "2b3-place-amulets", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-7", source: "2b3-place-amulets", target: "2b3-get-keycard", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-8", source: "2b3-get-keycard", target: "2b3-shoreline-escape", style: { stroke: "#8b5cf6" } },
  { id: "e-2b3-ending", source: "2b3-shoreline-escape", target: "debtor-ending-2", style: { stroke: "#8b5cf6" } },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find the path from the start node to a target node using BFS
 */
export function findPathToNode(
  targetId: string,
  nodes: Node[],
  edges: Edge[]
): Node[] {
  // Build adjacency list (reverse direction - from target to sources)
  const parentMap = new Map<string, string>();
  for (const edge of edges) {
    parentMap.set(edge.target, edge.source);
  }

  // Trace back from target to start
  const path: string[] = [];
  let current: string | undefined = targetId;
  
  while (current) {
    path.unshift(current);
    current = parentMap.get(current);
  }

  // Convert IDs to nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return path.map((id) => nodeMap.get(id)).filter((n): n is Node => n !== undefined);
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
  let totalCraftHours = 0;
  let totalTimeGateHours = 0;

  const steps: PathStep[] = pathNodes.map((node) => {
    const data = node.data as Record<string, unknown>;
    const cost = (data.cost as number) || 0;
    const isCraft = data.isCraft as boolean;
    const craftHours = (data.craftHours as number) || 0;
    const isTimeGate = data.isTimeGate as boolean;
    const timeGateHours = (data.timeGateHours as number) || 0;

    // Determine if cost is BTC (small number) or Roubles (large number)
    if (cost > 0) {
      if (cost < 100) {
        totalCostBTC += cost;
      } else {
        totalCostRoubles += cost;
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
    totalCraftHours,
    totalTimeGateHours,
  };
}
