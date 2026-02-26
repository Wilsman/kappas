export interface StorylineObjective {
  id: string;
  description: string;
  type: "main" | "optional";
  itemRequirement?: {
    itemId?: string;
    itemName: string;
    iconLink?: string;
    requiredCount: number;
    foundInRaid?: boolean;
  };
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
    id: "tour",
    name: "Tour",
    description:
      "Starting quest - automatically unlocked at the beginning of the storyline",
    icon: "/Tour_Icon.webp",
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
        id: "tour-opt-1",
        type: "optional",
        description: "Collect the required 250,000 Roubles",
      },
      {
        id: "tour-opt-2",
        type: "optional",
        description:
          "Find any 5 items in raid from the Building materials category",
      },
      {
        id: "tour-opt-3",
        type: "optional",
        description: "Find any 2 weapons in raid",
      },
      {
        id: "tour-opt-4",
        type: "optional",
        description: "Collect the required 20,000 Dollars",
      },
      {
        id: "tour-opt-5",
        type: "optional",
        description: "Find 5 PMC dogtags in raid",
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
      description:
        "Unlocks achievement Pathfinder, traders (Skier, Mechanic, Prapor, Peacekeeper), and direct access to all locations",
    },
  },
  {
    id: "falling-skies",
    name: "Falling Skies",
    description:
      "Best method: Keep doing Tour until completing Mechanic's quest, then go to the broken plane in Woods",
    notes: "Keeping the armored case results in -0.3 Prapor reputation.",
    icon: "/Falling_Skies_Icon.webp",
    objectives: [
      {
        id: "falling-skies-main-1",
        type: "main",
        description: "Locate the fallen plane",
      },
      {
        id: "falling-skies-main-2",
        type: "main",
        description: "Reach Loyalty Level 2 with Prapor",
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
        id: "falling-skies-main-5",
        type: "main",
        description: "Retrieve the flash drive from one of the G-Wagon SUVs",
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
        description: "Leave the flight recorder in the specified spot",
      },
      {
        id: "falling-skies-main-10",
        type: "main",
        description: "Visit Prapor",
      },
      {
        id: "falling-skies-main-11",
        type: "main",
        description: "Hand over 2 Toolset in raid",
        itemRequirement: {
          itemId: "590c2e1186f77425357b6124",
          itemName: "Toolset",
          iconLink: "https://assets.tarkov.dev/590c2e1186f77425357b6124-icon.webp",
          requiredCount: 2,
          foundInRaid: true,
        },
      },
      {
        id: "falling-skies-main-12",
        type: "main",
        description: "Hand over 3 Rechargeable battery in raid",
        itemRequirement: {
          itemId: "590a358486f77429692b2790",
          itemName: "Rechargeable battery",
          iconLink: "https://assets.tarkov.dev/590a358486f77429692b2790-icon.webp",
          requiredCount: 3,
          foundInRaid: true,
        },
      },
      {
        id: "falling-skies-main-13",
        type: "main",
        description: "Hand over 5 Printed circuit board in raid",
        itemRequirement: {
          itemId: "590a3b0486f7743954552bdb",
          itemName: "Printed circuit board",
          iconLink: "https://assets.tarkov.dev/590a3b0486f7743954552bdb-icon.webp",
          requiredCount: 5,
          foundInRaid: true,
        },
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
        description: "Retrieve the armored case",
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
      {
        id: "falling-skies-opt-1",
        type: "optional",
        description: "Hand over cash to Therapist 2,000$",
      },
    ],
  },
  {
    id: "the-ticket",
    name: "The Ticket",
    description: "Earned automatically after completing Falling Skies",
    icon: "/The_Ticket_Icon.webp",
  },
  {
    id: "batya",
    name: "Batya",
    description:
      "Turns out BEAR didn't send just regular squads into Tarkov, there were real SOF guys here. I'd like to know more about those units and what exactly they were doing.",
    icon: "/Batya_Icon.webp",
    objectives: [
      {
        id: "batya-main-1",
        type: "main",
        description: "Locate the traces of the BEAR special squad",
      },
      {
        id: "batya-main-2",
        type: "main",
        description: "Check BEAR outposts",
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
        description: "Locate the Carousel outpost",
      },
      {
        id: "batya-main-10",
        type: "main",
        description: "Learn more about Voevoda",
      },
      {
        id: "batya-main-11",
        type: "main",
        description: "Find the Bogatyr squad's personal notes",
      },
      {
        id: "batya-main-12",
        type: "main",
        description: "Learn more about Taran",
      },
      {
        id: "batya-main-13",
        type: "main",
        description: "Learn more about Strelets",
      },
      {
        id: "batya-main-14",
        type: "main",
        description: "Find Voevoda's personal belongings",
      },
      {
        id: "batya-main-15",
        type: "main",
        description: "Learn more about the Bogatyr squad's activities",
      },
      {
        id: "batya-main-16",
        type: "main",
        description: "Search the Gnezdo outpost",
      },
      {
        id: "batya-main-17",
        type: "main",
        description:
          "Retrieve more information about the ambush from Moreman's phone",
      },
      {
        id: "batya-main-18",
        type: "main",
        description: "Use Workbench to repair phone parts",
      },
      {
        id: "batya-main-19",
        type: "main",
        description: "Intelligence Center level 3",
      },
      {
        id: "batya-main-20",
        type: "main",
        description: "Use Intelligence Center radio station",
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
      {
        id: "batya-opt-6",
        type: "optional",
        description: "Locate and obtain Moreman's phone",
      },
    ],
  },
  {
    id: "the-unheard",
    name: "The Unheard",
    description: "The Unheard questline",
    icon: "/The_Unheard_Icon.webp",
    objectives: [
      {
        id: "unheard-main-1",
        type: "main",
        description: "Learn more about TerraGroup's activities",
      },
      {
        id: "unheard-main-2",
        type: "main",
        description:
          "Find more information about the special catalyst shipment",
      },
      {
        id: "unheard-main-3",
        type: "main",
        description: "Locate Rzhevsky's service vehicle",
      },
      {
        id: "unheard-main-4",
        type: "main",
        description: "Scout the underground laboratory",
      },
      {
        id: "unheard-main-5",
        type: "main",
        description: "Find cargo transport fax in The Lab",
      },
      {
        id: "unheard-main-6",
        type: "main",
        description:
          "Find document on changes in enterprise interactions in The Lab",
      },
      {
        id: "unheard-main-7",
        type: "main",
        description: "Find transport log with notes on Factory",
      },
    ],
  },
  {
    id: "blue-fire",
    name: "Blue Fire",
    description:
      "Find flyer at any of these locations:\n• Woods med camp: Inside a GREEN container taped to a white drawer\n• Interchange: New area flyer\n• Interchange: Big Terragroup area behind old co-op extract, med tent/bunker",
    notes:
      "Planting the device takes 60 seconds. Selling the fragment yields 1.5M roubles.",
    icon: "/Blue_Fire_Icon.webp",
    objectives: [
      {
        id: "blue-fire-main-1",
        type: "main",
        description: "Locate and obtain the device fragment",
      },
      {
        id: "blue-fire-main-2",
        type: "main",
        description: "Talk to Mechanic about the EMP blast",
      },
      {
        id: "blue-fire-main-3",
        type: "main",
        description: "Locate and obtain the device fragment in Chek 13",
      },
      {
        id: "blue-fire-main-4",
        type: "main",
        description: "Talk to Mechanic",
      },
      {
        id: "blue-fire-main-5",
        type: "main",
        description: "Plant the hacking device in the server room in The Lab",
      },
      {
        id: "blue-fire-opt-1",
        type: "optional",
        description: "Hand over the fragment of Item 1156 to Mechanic",
      },
      {
        id: "blue-fire-opt-2",
        type: "optional",
        description: "Keep the fragment of Item 1156 for yourself",
      },
      {
        id: "blue-fire-opt-3",
        type: "optional",
        description: "Find a lead on Item 1156 (if fragment was sold)",
      },
    ],
  },
  {
    id: "they-are-already-here",
    name: "They Are Already Here",
    description:
      "Complete any ONE of these:\n• Kill cultist\n• Loot dorms marked room\n• Get note next to cultist circle in abandoned village\n• Fisherman island on Shoreline where the green box is",
    notes: "Contains detailed info about tape locations and key spawns.",
    icon: "/They_Are_Already_Here_Icon.webp",
    objectives: [
      {
        id: "they-are-already-here-main-1",
        type: "main",
        description: "Find 'Note about the Eye of the World'",
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
        id: "they-are-already-here-main-4",
        type: "main",
        description: "Obtain and read the planted book",
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
        description: "Locate and neutralize 2 Cultist Priests",
      },
      {
        id: "they-are-already-here-main-9",
        type: "main",
        description: "Obtain more information on the Eye of the World",
      },
      {
        id: "they-are-already-here-opt-1",
        type: "optional",
        description: "Obtain the key to the apartment",
      },
    ],
  },
  {
    id: "accidental-witness",
    name: "Accidental Witness",
    description: "Check the car between customs dorm",
    icon: "/Accidental_Witness_Icon.webp",
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
        id: "accidental-witness-opt-3",
        type: "optional",
        description: "Find the key to Skier's accomplice's apartment",
      },
    ],
  },
  {
    id: "the-labyrinth",
    name: "The Labyrinth",
    description:
      "Go into the access tunnel in Shoreline Resort Basement\n\nRequires: Knossos key\nSee: escapefromtarkov.fandom.com/wiki/Knossos_LLC_facility_key",
    notes:
      "Extremely dangerous area; includes traps, poison, tripwires, and miniboss versions of Tagilla and possibly Killa.",
    icon: "/The_Labyrinth_Chapter_Icon.webp",
    objectives: [
      {
        id: "labyrinth-main-1",
        type: "main",
        description: "Accept Mechanic's quest 'Shady Contractor'",
      },
      {
        id: "labyrinth-main-2",
        type: "main",
        description: "Visit Therapist for information",
      },
      {
        id: "labyrinth-main-3",
        type: "main",
        description: "Visit Jaeger and negotiate help",
      },
      {
        id: "labyrinth-main-4",
        type: "main",
        description: "Wait 48 hours for keycards",
      },
      {
        id: "labyrinth-main-5",
        type: "main",
        description: "Collect 2 Labrys access keycards",
        itemRequirement: {
          itemId: "679b9819a2f2dd4da9023512",
          itemName: "Labrys access keycard",
          iconLink: "https://assets.tarkov.dev/679b9819a2f2dd4da9023512-icon.webp",
          requiredCount: 2,
        },
      },
      {
        id: "labyrinth-main-6",
        type: "main",
        description: "Reach the Labyrinth via Shoreline Health Resort",
      },
      {
        id: "labyrinth-main-7",
        type: "main",
        description: "Disable starting-room trap to exit",
      },
      {
        id: "labyrinth-main-8",
        type: "main",
        description: "Navigate the Labyrinth hazards",
      },
      {
        id: "labyrinth-main-9",
        type: "main",
        description: "Survive enemy waves",
      },
      {
        id: "labyrinth-main-10",
        type: "main",
        description: "Defeat Shadow of Tagilla",
      },
      {
        id: "labyrinth-main-11",
        type: "main",
        description: "Survive potential Killa ambush",
      },
    ],
  },
];
