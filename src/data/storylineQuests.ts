export interface StorylineObjective {
  id: string;
  description: string;
  type: "main" | "optional";
  progress?: {
    current: number;
    required: number;
  };
  notes?: string;
}

export interface StorylineRewards {
  description: string;
  items?: string[];
}

export interface StorylineQuest {
  id: string;
  name: string;
  description: string;
  icon: string;
  notes?: string;
  objectives?: StorylineObjective[];
  rewards?: StorylineRewards;
}

export const STORYLINE_QUESTS: StorylineQuest[] = [
  {
    id: "falling-skies",
    name: "Falling Skies",
    description:
      "Best method: Keep doing Tour until completing Mechanic's quest, then go to the broken plane in Woods",
    notes:
      "⚠️ Known Issues:\n• Quest is rumored to be bugged\n• Some reports say standard accounts need 0.2 Prapor Reputation to progress\n• Quest actually requires 'Reach Prapor LVL 2' which may cause softlock for some players",
    icon: "/2.png",
    objectives: [
      {
        id: "falling-skies-main-1",
        type: "main",
        description: "Locate the fallen plane",
      },
      {
        id: "falling-skies-main-2",
        type: "main",
        description:
          "Reach Loyalty Level 2 with Prapor (Non-Unheard Or EOD Only)",
      },
      {
        id: "falling-skies-main-3",
        type: "main",
        description: "Ask the traders about the fallen plane",
      },
      {
        id: "falling-skies-main-4",
        type: "main",
        description: "Gather information from Therapist",
      },
      {
        id: "falling-skies-opt-1",
        type: "optional",
        description: "Hand over cash to Therapist 2,000$",
      },
      {
        id: "falling-skies-main-5",
        type: "main",
        description:
          "Retrieve the flash drive from one of the G-Wagon SUVs (Shoreline near Tunnel)",
      },
      {
        id: "falling-skies-main-6",
        type: "main",
        description: "Hand over flash drive to Prapor",
      },
      {
        id: "falling-skies-main-7",
        type: "main",
        description: "Wait for Prapor",
      },
      {
        id: "falling-skies-main-8",
        type: "main",
        description: "Retrieve the plane's flight recorder",
      },
      {
        id: "falling-skies-main-9",
        type: "main",
        description:
          "Leave the flight recorder in the specified spot (Shoreline in the house corner room at the fishers' island)",
      },
      {
        id: "falling-skies-main-10",
        type: "main",
        description: "Visit Prapor",
      },
      {
        id: "falling-skies-main-11",
        type: "main",
        description: "Hand over 2 Toolset",
      },
      {
        id: "falling-skies-main-12",
        type: "main",
        description: "Hand over 3 Rechargeable battery",
      },
      {
        id: "falling-skies-main-13",
        type: "main",
        description: "Hand over 5 Printed circuit board",
      },
      {
        id: "falling-skies-main-14",
        type: "main",
        description: "Longer wait for Prapor",
      },
      {
        id: "falling-skies-main-15",
        type: "main",
        description: "Hand over the flight crew's transcript to Prapor",
      },
      {
        id: "falling-skies-main-16",
        type: "main",
        description: "Hand over Elektronik's secure flash drive to Prapor",
      },
      {
        id: "falling-skies-main-17",
        type: "main",
        description: "Wait for Prapor",
      },
      {
        id: "falling-skies-main-18",
        type: "main",
        description: "Retrieve the armored case and choose one of:",
      },
      {
        id: "falling-skies-main-19",
        type: "main",
        description: "Hand over the armored case to Prapor",
      },
      {
        id: "falling-skies-main-20",
        type: "main",
        description: "Keep the armored case for yourself",
      },
    ],
  },
  {
    id: "tour",
    name: "Tour",
    description:
      "Starting quest - automatically unlocked at the beginning of the storyline",
    icon: "/1.png",
    objectives: [
      {
        id: "tour-main-1",
        type: "main",
        description: "Escape Ground Zero",
      },
      {
        id: "tour-main-2",
        type: "main",
        description: "Talk to Therapist",
      },
      {
        id: "tour-main-3",
        type: "main",
        description: "Ensure access to the Streets of Tarkov",
      },
      {
        id: "tour-main-4",
        type: "main",
        description: "Hand over the cash to Therapist",
      },
      {
        id: "tour-opt-1",
        type: "optional",
        description: "Collect the required 250,000 Roubles",
        progress: { current: 0, required: 250000 },
      },
      {
        id: "tour-main-5",
        type: "main",
        description: "Talk to Ragman",
      },
      {
        id: "tour-main-6",
        type: "main",
        description: "Survive and extract from Interchange",
      },
      {
        id: "tour-main-7",
        type: "main",
        description: "Tell Ragman what you found during the recon",
      },
      {
        id: "tour-main-8",
        type: "main",
        description: "Talk to Skier",
      },
      {
        id: "tour-main-9",
        type: "main",
        description: "Survive and extract from Customs",
      },
      {
        id: "tour-main-10",
        type: "main",
        description:
          "Hand over any 5 found in raid Building materials items to Skier",
        progress: { current: 0, required: 5 },
      },
      {
        id: "tour-opt-2",
        type: "optional",
        description:
          "Find any 5 items in raid from the Building materials category",
        progress: { current: 0, required: 5 },
      },
      {
        id: "tour-main-11",
        type: "main",
        description: "Talk to Mechanic",
      },
      {
        id: "tour-main-12",
        type: "main",
        description: "Survive and extract from Factory",
      },
      {
        id: "tour-main-13",
        type: "main",
        description: "Hand over any 2 found in raid weapons to Mechanic",
        progress: { current: 0, required: 2 },
      },
      {
        id: "tour-opt-3",
        type: "optional",
        description: "Find any 2 weapons in raid",
        progress: { current: 0, required: 2 },
      },
      {
        id: "tour-main-14",
        type: "main",
        description: "Talk to Skier",
      },
      {
        id: "tour-main-15",
        type: "main",
        description: "Eliminate any 3 targets on Woods",
        progress: { current: 0, required: 3 },
      },
      {
        id: "tour-main-16",
        type: "main",
        description: "Survive and extract from Woods",
      },
      {
        id: "tour-main-17",
        type: "main",
        description: "Locate the entrance to the port Terminal",
      },
      {
        id: "tour-main-18",
        type: "main",
        description: "Find a way to contact the soldiers at the Terminal",
      },
      {
        id: "tour-main-19",
        type: "main",
        description: "Use the intercom to contact the port garrison",
      },
      {
        id: "tour-main-20",
        type: "main",
        description: "Learn how to escape Tarkov",
      },
      {
        id: "tour-main-21",
        type: "main",
        description: "Ensure access to Lighthouse",
      },
      {
        id: "tour-main-22",
        type: "main",
        description: "Hand over 20,000 Dollars to Mechanic",
        progress: { current: 0, required: 20000 },
      },
      {
        id: "tour-opt-4",
        type: "optional",
        description: "Collect the required 20,000 Dollars",
        progress: { current: 0, required: 20000 },
      },
      {
        id: "tour-main-23",
        type: "main",
        description: "Ensure access to Reserve",
      },
      {
        id: "tour-main-24",
        type: "main",
        description: "Hand over 5 PMC dogtags to Prapor",
        progress: { current: 0, required: 5 },
      },
      {
        id: "tour-opt-5",
        type: "optional",
        description: "Find 5 PMC dogtags in raid",
        progress: { current: 0, required: 5 },
      },
      {
        id: "tour-main-25",
        type: "main",
        description: "Survive and extract from Shoreline",
      },
      {
        id: "tour-main-26",
        type: "main",
        description: "Ensure access to The Lab",
      },
      {
        id: "tour-main-27",
        type: "main",
        description: "Access the secret TerraGroup facility",
      },
      {
        id: "tour-main-28",
        type: "main",
        description:
          "Locate the escape path through the drainage system in The Lab",
      },
      {
        id: "tour-main-29",
        type: "main",
        description: "Search the server room in The Lab",
      },
      {
        id: "tour-main-30",
        type: "main",
        description: "Search the top management offices in The Lab",
      },
      {
        id: "tour-opt-6",
        type: "optional",
        description: "Locate the entrance to the facility on Factory",
      },
      {
        id: "tour-opt-7",
        type: "optional",
        description: "Locate the entrance to the facility on Streets of Tarkov",
      },
      {
        id: "tour-opt-8",
        type: "optional",
        description: "Obtain a keycard or access codes to enter the facility",
      },
    ],
    rewards: {
      description: "Access to Shoreline and buy equipment from Peacekeeper",
    },
  },
  {
    id: "accidental-witness",
    name: "Accidental Witness",
    description: "Check the car between customs dorm",
    icon: "/7.png",
    objectives: [
      {
        id: "accidental-witness-main-1",
        type: "main",
        description: "Figure out where Kozlov lived",
      },
      {
        id: "accidental-witness-main-2",
        type: "main",
        description: "Read the note on Kozlov's door",
      },
      {
        id: "accidental-witness-main-3",
        type: "main",
        description: "Find out what Kozlov was involved in",
      },
      {
        id: "accidental-witness-opt-1",
        type: "optional",
        description: "Access Kozlov's room",
      },
      {
        id: "accidental-witness-opt-2",
        type: "optional",
        description: "Figure out where to get Kozlov's key",
      },
      {
        id: "accidental-witness-main-4",
        type: "main",
        description: "Ask the traders about Anastasia",
      },
      {
        id: "accidental-witness-main-5",
        type: "main",
        description: "Access Skier's accomplice's apartment",
      },
      {
        id: "accidental-witness-opt-3",
        type: "optional",
        description: "Find the key to the apartment",
      },
      {
        id: "accidental-witness-main-6",
        type: "main",
        description: "Learn more about Skier's accomplice's apartment",
      },
      {
        id: "accidental-witness-main-7",
        type: "main",
        description: "Read the documents in Skier's accomplice's apartment",
      },
      {
        id: "accidental-witness-main-8",
        type: "main",
        description: "Report to Skier",
      },
      {
        id: "accidental-witness-main-9",
        type: "main",
        description: "Talk to Ragman",
      },
      {
        id: "accidental-witness-main-10",
        type: "main",
        description: "Locate Anastasia's apartment",
      },
      {
        id: "accidental-witness-main-11",
        type: "main",
        description: "Investigate the entrance to Anastasia's building",
      },
      {
        id: "accidental-witness-main-12",
        type: "main",
        description: "Learn more about Anastasia",
      },
      {
        id: "accidental-witness-main-13",
        type: "main",
        description: "Locate courier Pasha",
      },
      {
        id: "accidental-witness-main-14",
        type: "main",
        description: "Search the ambush spot",
      },
      {
        id: "accidental-witness-main-15",
        type: "main",
        description: "Talk to Skier",
      },
      {
        id: "accidental-witness-main-16",
        type: "main",
        description: "Locate Reshala's stash",
      },
      {
        id: "accidental-witness-main-17",
        type: "main",
        description: "Investigate Reshala's bunkhouse",
      },
      {
        id: "accidental-witness-main-18",
        type: "main",
        description: "Locate Kozlov's hideout",
      },
      {
        id: "accidental-witness-main-19",
        type: "main",
        description: "Locate and obtain Kozlov's evidence",
      },
    ],
  },
  {
    id: "batya",
    name: "Batya",
    description:
      "Turns out BEAR didn’t send just regular squads into Tarkov, there were real SOF guys here. I’d like to know more about those units and what exactly they were doing.",
    icon: "/3.png",
    objectives: [
      {
        id: "batya-main-1",
        type: "main",
        description: "Locate the traces of the BEAR special squad",
      },
      {
        id: "batya-main-2",
        type: "main",
        description: "I should check BEAR outposts",
      },
      {
        id: "batya-main-3",
        type: "main",
        description: "Learn more about the Bogatyr squad from the traders",
      },
      {
        id: "batya-main-4",
        type: "main",
        description: "Locate the Gnezdo outpost",
        notes:
          "The outpost is in the forest on the western side of the Ultra mall",
      },
      {
        id: "batya-main-5",
        type: "main",
        description: "Figure out what happened to the Bogatyr squad",
      },
      {
        id: "batya-main-6",
        type: "main",
        description: "Learn more about the Bogatyr squad's members",
      },
      {
        id: "batya-main-7",
        type: "main",
        description: "Locate the Ryabina outpost",
        notes:
          "It should be somewhere on the ridge in the Priozersk forest, it was used as an observation point",
      },
      {
        id: "batya-main-8",
        type: "main",
        description: "Find more information about the Bogatyr squad",
      },
      {
        id: "batya-main-9",
        type: "main",
        description: "I should search the large stores or shopping malls",
      },
      {
        id: "batya-main-10",
        type: "main",
        description: "Locate the Carousel outpost",
      },
      {
        id: "batya-main-11",
        type: "main",
        description: "Learn more about Voevoda",
      },
      {
        id: "batya-main-12",
        type: "main",
        description: "Find the Bogatyr squad's personal notes",
      },
      {
        id: "batya-main-13",
        type: "main",
        description: "Learn more about Taran",
      },
      {
        id: "batya-main-14",
        type: "main",
        description: "Learn more about Strelets",
      },
      {
        id: "batya-main-15",
        type: "main",
        description: "Find Voevoda's personal belongings",
      },
      {
        id: "batya-main-16",
        type: "main",
        description: "Learn more about the Bogatyr squad's activities",
      },
      {
        id: "batya-main-17",
        type: "main",
        description: "Search the Gnezdo outpost",
      },
      {
        id: "batya-opt-1",
        type: "optional",
        description: "Locate and obtain the squad commander's recorder",
      },
      {
        id: "batya-opt-2",
        type: "optional",
        description: "Locate and obtain a keepsake of one of the Bogatyrs",
      },
      {
        id: "batya-opt-3",
        type: "optional",
        description: "Locate and obtain a personal item of one of the Bogatyrs",
      },
      {
        id: "batya-opt-4",
        type: "optional",
        description: "Locate and obtain a dogtag of one of the Bogatyrs",
      },
      {
        id: "batya-opt-5",
        type: "optional",
        description: "Locate and obtain the Bogatyr squad patch",
      },
    ],
  },
  {
    id: "blue-fire",
    name: "Blue Fire",
    description:
      "Find flyer at any of these locations:\n• Woods med camp: Inside a GREEN container taped to a white drawer\n• Interchange: New area flyer\n• Interchange: Big Terragroup area behind old co-op extract, med tent/bunker",
    icon: "/5.png",
    objectives: [
      {
        id: "blue-fire-main-1",
        type: "main",
        description: "Locate and obtain the device fragment",
      },
      {
        id: "blue-fire-main-2",
        type: "main",
        description:
          "The device fragment might have been taken by Scavs of the cultists; I should check their spots on Streets of Tarkov and Ground Zero",
      },
    ],
  },
  {
    id: "the-labyrinth",
    name: "The Labyrinth",
    description:
      "Go into the access tunnel in Shoreline Resort Basement\n\nRequires: Knossos key\nSee: escapefromtarkov.fandom.com/wiki/Knossos_LLC_facility_key",
    icon: "/8.png",
    objectives: [],
  },
  {
    id: "they-are-already-here",
    name: "They Are Already Here",
    description:
      "Complete any ONE of these:\n• Kill cultist\n• Loot dorms marked room\n• Get note next to cultist circle in abandoned village\n• Fisherman island on Shoreline where the green box is",
    icon: "/6.png",
    objectives: [
      {
        id: "they-are-already-here-main-1",
        type: "main",
        description: 'Find "Note about the Eye of the World"',
      },
      {
        id: "they-are-already-here-main-2",
        type: "main",
        description: "Locate a place connected to the Eye of the World",
      },
      {
        id: "they-are-already-here-main-3",
        type: "main",
        description: "Locate the cult victim's apartment",
      },
      {
        id: "they-are-already-here-opt-1",
        type: "optional",
        description: "Obtain the key to the apartment",
      },
      {
        id: "they-are-already-here-main-4",
        type: "main",
        description:
          "Obtain and read the book that the cultists planted with Igor",
      },
      {
        id: "they-are-already-here-main-5",
        type: "main",
        description: "Investigate the victim's apartment",
      },
      {
        id: "they-are-already-here-main-6",
        type: "main",
        description: "Obtain the victim's first audio tape",
      },
      {
        id: "they-are-already-here-main-7",
        type: "main",
        description: "Ask Mechanic about the Eye of the World",
      },
      {
        id: "they-are-already-here-main-8",
        type: "main",
        description: "Locate and neutralize 3x Cultist Priests",
      },
      {
        id: "they-are-already-here-main-9",
        type: "main",
        description: "Obtain more information on the Eye of the World",
      },
    ],
  },
  {
    id: "the-ticket",
    name: "The Ticket",
    description: "Earned automatically after completing Falling Skies",
    icon: "/9.png",
  },
];
