export type KordBreachModifierCategory = "global" | "positive" | "negative";

export interface KordBreachModifier {
  id: string;
  name: string;
  category: KordBreachModifierCategory;
  points: number;
  effects: readonly string[];
}

export const KORD_BREACH_GLOBAL_MODIFIERS = [
  {
    id: "no-insurance",
    name: "No Insurance",
    category: "global",
    points: 0,
    effects: ["Items cannot be insured before a raid."],
  },
  {
    id: "black-division",
    name: "Black Division",
    category: "global",
    points: 0,
    effects: [
      "Black Division operatives can be encountered on specific locations.",
    ],
  },
  {
    id: "no-fir-for-hideout",
    name: "No FiR for Hideout",
    category: "global",
    points: 0,
    effects: ["Hideout zones do not require the Found in Raid status."],
  },
  {
    id: "armor-shortage",
    name: "Armor Shortage",
    category: "global",
    points: 0,
    effects: ["Traders across Tarkov are experiencing an armor shortage."],
  },
  {
    id: "handyman",
    name: "Handyman",
    category: "global",
    points: 0,
    effects: [
      "Item crafting time is reduced by 50%.",
      "Crafting skill starts at level 51.",
    ],
  },
  {
    id: "seasoned-pmcs",
    name: "Seasoned PMCs",
    category: "global",
    points: 0,
    effects: ["Your character gains 25% more raid experience."],
  },
] as const satisfies readonly KordBreachModifier[];

export const KORD_BREACH_POSITIVE_MODIFIERS = [
  {
    id: "marathon-runner",
    name: "Marathon Runner",
    category: "positive",
    points: -3,
    effects: ["Arm and leg stamina is consumed 15% slower."],
  },
  {
    id: "safecracker",
    name: "Safecracker",
    category: "positive",
    points: -6,
    effects: [
      "Mechanical keys have a 20% chance not to lose durability when used.",
    ],
  },
  {
    id: "bushborne",
    name: "Bushborne",
    category: "positive",
    points: -5,
    effects: [
      "Walking in vegetation generates 50% less noise and movement slowdown.",
    ],
  },
  {
    id: "juice-time",
    name: "Juice Time",
    category: "positive",
    points: -2,
    effects: [
      "Consuming a juice drink grants the Painkiller effect for 60 seconds.",
    ],
  },
  {
    id: "sailors-nostalgia",
    name: "Sailor's Nostalgia",
    category: "positive",
    points: -2,
    effects: [
      "Consuming canned fish grants Health Regeneration (+2) for 10 seconds.",
    ],
  },
  {
    id: "youth",
    name: "Youth",
    category: "positive",
    points: -3,
    effects: [
      "Energy is consumed 20% slower.",
      "Arm and leg stamina is increased by 10.",
    ],
  },
  {
    id: "street-tax",
    name: "Street Tax",
    category: "positive",
    points: -1,
    effects: ["Once per week, some Scavs pay you protection money."],
  },
  {
    id: "the-tarkov-shooter",
    name: "The Tarkov Shooter",
    category: "positive",
    points: -3,
    effects: [
      "Bolt-action Rifles skill leveling speed is increased by 100%.",
      "Bolt-action Rifles skill starts at level 10.",
    ],
  },
  {
    id: "diet",
    name: "Diet",
    category: "positive",
    points: -1,
    effects: ["All provisions consume 50% less resource."],
  },
  {
    id: "hercules",
    name: "Hercules",
    category: "positive",
    points: -3,
    effects: ["Strength and Endurance skills start at level 15."],
  },
  {
    id: "sprinter",
    name: "Sprinter",
    category: "positive",
    points: -2,
    effects: ["Running speed is increased by 5%."],
  },
  {
    id: "thrombophilia",
    name: "Thrombophilia",
    category: "positive",
    points: -2,
    effects: ["Bleeding chance is decreased by 25%."],
  },
  {
    id: "hypodipsia",
    name: "Hypodipsia",
    category: "positive",
    points: -2,
    effects: ["Hydration is consumed 15% slower."],
  },
  {
    id: "polyphagia",
    name: "Polyphagia",
    category: "positive",
    points: -2,
    effects: ["Energy is consumed 15% slower."],
  },
  {
    id: "sturdy-bones",
    name: "Sturdy Bones",
    category: "positive",
    points: -3,
    effects: [
      "Limb fracture chance is decreased by 15%.",
      "Falling from heights deals 15% less damage.",
    ],
  },
  {
    id: "average",
    name: "Average",
    category: "positive",
    points: -10,
    effects: [
      "All character skills start at level 25 but cannot be increased further, excluding Crafting.",
    ],
  },
  {
    id: "kappa-protocol",
    name: "Kappa Protocol",
    category: "positive",
    points: -21,
    effects: ["Immediately receive Secure container Kappa."],
  },
] as const satisfies readonly KordBreachModifier[];

export const KORD_BREACH_NEGATIVE_MODIFIERS = [
  {
    id: "hemophilia",
    name: "Hemophilia",
    category: "negative",
    points: 2,
    effects: ["Bleeding chance is increased by 25%."],
  },
  {
    id: "osteoporosis",
    name: "Osteoporosis",
    category: "negative",
    points: 3,
    effects: [
      "Limb fracture chance is increased by 15%.",
      "Falling from heights deals 15% more damage.",
    ],
  },
  {
    id: "exhaustion",
    name: "Exhaustion",
    category: "negative",
    points: 4,
    effects: [
      "Arm and leg stamina recovers 15% slower.",
      "Arm and leg stamina is reduced by 10.",
    ],
  },
  {
    id: "well-that-hurt",
    name: "Well That Hurt!",
    category: "negative",
    points: 2,
    effects: ["All medkit uses consume 25% more resource."],
  },
  {
    id: "incompetent",
    name: "Incompetent",
    category: "negative",
    points: 4,
    effects: [
      "All character skills level 25% slower, excluding Bolt-action Rifles.",
      "All character skills are capped at level 30, excluding Crafting.",
    ],
  },
  {
    id: "polydipsia",
    name: "Polydipsia",
    category: "negative",
    points: 1,
    effects: ["Hydration is consumed 15% faster."],
  },
  {
    id: "chronic-fatigue-syndrome",
    name: "Chronic Fatigue Syndrome",
    category: "negative",
    points: 1,
    effects: ["Energy is consumed 15% faster."],
  },
  {
    id: "personality-vacuum",
    name: "Personality Vacuum",
    category: "negative",
    points: 2,
    effects: [
      "Charisma skill cannot be increased.",
      "All trader items cost 20% more.",
    ],
  },
  {
    id: "dr-jekyll",
    name: "Dr. Jekyll",
    category: "negative",
    points: 1,
    effects: [
      "After gaining the Fresh Wound status, it cannot be removed until the end of the raid.",
    ],
  },
  {
    id: "allergic",
    name: "Allergic",
    category: "negative",
    points: 3,
    effects: [
      "Become allergic to 2 random items from the Provisions or Medication category.",
    ],
  },
  {
    id: "broken-secure-container",
    name: "Broken Secure Container",
    category: "negative",
    points: 4,
    effects: [
      "Secure container is restricted to cash, keys, dogtags, special equipment, and certain containers.",
    ],
  },
  {
    id: "no-flea-market",
    name: "No Flea Market",
    category: "negative",
    points: 6,
    effects: ["Trading with players on the Flea Market is disabled."],
  },
  {
    id: "third-leg",
    name: "Third Leg",
    category: "negative",
    points: 1,
    effects: [
      "Movement speed is decreased by 1%.",
      "Buying items at Therapist is 5% cheaper.",
    ],
  },
] as const satisfies readonly KordBreachModifier[];

export const KORD_BREACH_PERSONAL_MODIFIERS = [
  ...KORD_BREACH_POSITIVE_MODIFIERS,
  ...KORD_BREACH_NEGATIVE_MODIFIERS,
] as const satisfies readonly KordBreachModifier[];

export const KORD_BREACH_ALL_MODIFIERS = [
  ...KORD_BREACH_GLOBAL_MODIFIERS,
  ...KORD_BREACH_PERSONAL_MODIFIERS,
] as const satisfies readonly KordBreachModifier[];

