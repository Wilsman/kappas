import { TaskData } from '../types';

// Sample data for demonstration
export const sampleData: TaskData = {
  "data": {
    "tasks": [
      {
        "id": "657315ddab5a49b71f098853",
        "minPlayerLevel": 1,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/First_in_Line",
        "name": "First in Line",
        "trader": {
          "name": "Therapist"
        }
      },
      {
        "id": "657315df034d76585f032e01",
        "minPlayerLevel": 1,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shooting_Cans",
        "name": "Shooting Cans",
        "trader": {
          "name": "Prapor"
        }
      },
      {
        "id": "657315e270bb0b8dba00cc48",
        "minPlayerLevel": 1,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Burning_Rubber",
        "name": "Burning Rubber",
        "trader": {
          "name": "Skier"
        }
      },
      {
        "id": "657315e4a6af4ab4b50f3459",
        "minPlayerLevel": 1,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Saving_the_Mole",
        "name": "Saving the Mole",
        "trader": {
          "name": "Mechanic"
        }
      },
      {
        "id": "5936d90786f7742b1420ba5b",
        "minPlayerLevel": 1,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Debut",
        "name": "Debut",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315df034d76585f032e01",
              "name": "Shooting Cans"
            }
          }
        ]
      },
      {
        "id": "5967733e86f774602332fc84",
        "minPlayerLevel": 1,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shortage",
        "name": "Shortage",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315ddab5a49b71f098853",
              "name": "First in Line"
            }
          }
        ]
      },
      {
        "id": "657315e1dccd301f1301416a",
        "minPlayerLevel": 1,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Luxurious_Life",
        "name": "Luxurious Life",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5936d90786f7742b1420ba5b",
              "name": "Debut"
            }
          }
        ]
      },
      {
        "id": "5936da9e86f7742d65037edf",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Background_Check",
        "name": "Background Check",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315e1dccd301f1301416a",
              "name": "Luxurious Life"
            }
          }
        ]
      },
      {
        "id": "5ac23c6186f7741247042bad",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_1",
        "name": "Gunsmith - Part 1",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315e4a6af4ab4b50f3459",
              "name": "Saving the Mole"
            }
          }
        ]
      },
      {
        "id": "5bc4776586f774512d07cf05",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_1",
        "name": "The Tarkov Shooter - Part 1",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d24b81486f77439c92d6ba8",
              "name": "Acquaintance"
            }
          }
        ]
      },
      {
        "id": "5bc479e586f7747f376c7da3",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_2",
        "name": "The Tarkov Shooter - Part 2",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc4776586f774512d07cf05",
              "name": "The Tarkov Shooter - Part 1"
            }
          }
        ]
      },
      {
        "id": "5bc47dbf86f7741ee74e93b9",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_3",
        "name": "The Tarkov Shooter - Part 3",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc479e586f7747f376c7da3",
              "name": "The Tarkov Shooter - Part 2"
            }
          }
        ]
      },
      {
        "id": "5bc480a686f7741af0342e29",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_4",
        "name": "The Tarkov Shooter - Part 4",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc47dbf86f7741ee74e93b9",
              "name": "The Tarkov Shooter - Part 3"
            }
          }
        ]
      },
      {
        "id": "5bc4826c86f774106d22d88b",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_5",
        "name": "The Tarkov Shooter - Part 5",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc480a686f7741af0342e29",
              "name": "The Tarkov Shooter - Part 4"
            }
          }
        ]
      },
      {
        "id": "5bc4836986f7740c0152911c",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_6",
        "name": "The Tarkov Shooter - Part 6",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc4826c86f774106d22d88b",
              "name": "The Tarkov Shooter - Part 5"
            }
          }
        ]
      },
      {
        "id": "5bc4856986f77454c317bea7",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_7",
        "name": "The Tarkov Shooter - Part 7",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc4836986f7740c0152911c",
              "name": "The Tarkov Shooter - Part 6"
            }
          }
        ]
      },
      {
        "id": "5bc4893c86f774626f5ebf3e",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Shooter_-_Part_8",
        "name": "The Tarkov Shooter - Part 8",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc4856986f77454c317bea7",
              "name": "The Tarkov Shooter - Part 7"
            }
          }
        ]
      },
      {
        "id": "5d2495a886f77425cd51e403",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Introduction",
        "name": "Introduction",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac23c6186f7741247042bad",
              "name": "Gunsmith - Part 1"
            }
          }
        ]
      },
      {
        "id": "5d24b81486f77439c92d6ba8",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Acquaintance",
        "name": "Acquaintance",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d2495a886f77425cd51e403",
              "name": "Introduction"
            }
          }
        ]
      },
      {
        "id": "5d25aed386f77442734d25d2",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Unprotected_but_Dangerous",
        "name": "The Survivalist Path - Unprotected but Dangerous",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d24b81486f77439c92d6ba8",
              "name": "Acquaintance"
            }
          }
        ]
      },
      {
        "id": "5d25b6be86f77444001e1b89",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Thrifty",
        "name": "The Survivalist Path - Thrifty",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25aed386f77442734d25d2",
              "name": "The Survivalist Path - Unprotected but Dangerous"
            }
          }
        ]
      },
      {
        "id": "5d25bfd086f77442734d3007",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Zhivchik",
        "name": "The Survivalist Path - Zhivchik",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25b6be86f77444001e1b89",
              "name": "The Survivalist Path - Thrifty"
            }
          }
        ]
      },
      {
        "id": "5d25c81b86f77443e625dd71",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Wounded_Beast",
        "name": "The Survivalist Path - Wounded Beast",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25bfd086f77442734d3007",
              "name": "The Survivalist Path - Zhivchik"
            }
          }
        ]
      },
      {
        "id": "5d25cf2686f77443e75488d4",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Tough_Guy",
        "name": "The Survivalist Path - Tough Guy",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25c81b86f77443e625dd71",
              "name": "The Survivalist Path - Wounded Beast"
            }
          }
        ]
      },
      {
        "id": "5d25d2c186f77443e35162e5",
        "minPlayerLevel": 2,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Cold_Blooded",
        "name": "The Survivalist Path - Cold Blooded",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25c81b86f77443e625dd71",
              "name": "The Survivalist Path - Wounded Beast"
            }
          }
        ]
      },
      {
        "id": "5d25e29d86f7740a22516326",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Eagle-Owl",
        "name": "The Survivalist Path - Eagle-Owl",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25cf2686f77443e75488d4",
              "name": "The Survivalist Path - Tough Guy"
            }
          }
        ]
      },
      {
        "id": "5d25e2a986f77409dd5cdf2a",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Combat_Medic",
        "name": "The Survivalist Path - Combat Medic",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e29d86f7740a22516326",
              "name": "The Survivalist Path - Eagle-Owl"
            }
          }
        ]
      },
      {
        "id": "5d25e2c386f77443e7549029",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Trophy",
        "name": "The Huntsman Path - Trophy",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2b486f77409de05bba0",
              "name": "The Huntsman Path - Secured Perimeter"
            }
          }
        ]
      },
      {
        "id": "5d25e2cc86f77443e47ae019",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Forest_Cleaning",
        "name": "The Huntsman Path - Forest Cleaning",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2b486f77409de05bba0",
              "name": "The Huntsman Path - Secured Perimeter"
            }
          }
        ]
      },
      {
        "id": "5d25e2d886f77442734d335e",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Controller",
        "name": "The Huntsman Path - Controller",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          }
        ]
      },
      {
        "id": "5d25e43786f7740a212217fa",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Justice",
        "name": "The Huntsman Path - Justice",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2c386f77443e7549029",
              "name": "The Huntsman Path - Trophy"
            }
          }
        ]
      },
      {
        "id": "5d25e44386f77409453bce7b",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Evil_Watchman",
        "name": "The Huntsman Path - Evil Watchman",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          }
        ]
      },
      {
        "id": "5eaaaa7c93afa0558f3b5a1c",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Survivalist_Path_-_Junkie",
        "name": "The Survivalist Path - Junkie",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2a986f77409dd5cdf2a",
              "name": "The Survivalist Path - Combat Medic"
            }
          }
        ]
      },
      {
        "id": "669fa3979b0ce3feae01a130",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Claustrophobia",
        "name": "Claustrophobia",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          }
        ]
      },
      {
        "id": "66b38c7bf85b8bf7250f9cb6",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Rough_Tarkov",
        "name": "Rough Tarkov",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d24b81486f77439c92d6ba8",
              "name": "Acquaintance"
            }
          }
        ]
      },
      {
        "id": "66b38e144f2ab7cc530c3fe7",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Every_Hunter_Knows_This",
        "name": "Every Hunter Knows This",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66b38c7bf85b8bf7250f9cb6",
              "name": "Rough Tarkov"
            }
          }
        ]
      },
      {
        "id": "675c1cf4a757ddd00404f0a3",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Work_Smarter",
        "name": "Work Smarter",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d24b81486f77439c92d6ba8",
              "name": "Acquaintance"
            }
          }
        ]
      },
      {
        "id": "675c1ec7a46173572a0bf20a",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Rite_of_Passage",
        "name": "Rite of Passage",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "675c1cf4a757ddd00404f0a3",
              "name": "Work Smarter"
            }
          }
        ]
      },
      {
        "id": "5d25e2b486f77409de05bba0",
        "minPlayerLevel": 2,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Secured_Perimeter",
        "name": "The Huntsman Path - Secured Perimeter",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc47dbf86f7741ee74e93b9",
              "name": "The Tarkov Shooter - Part 3"
            }
          },
          {
            "task": {
              "id": "5d25cf2686f77443e75488d4",
              "name": "The Survivalist Path - Tough Guy"
            }
          }
        ]
      },
      {
        "id": "66058cb22cee99303f1ba067",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Easy_Money_-_Part_1",
        "name": "Easy Money - Part 1",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315e270bb0b8dba00cc48",
              "name": "Burning Rubber"
            }
          }
        ]
      },
      {
        "id": "59674cd986f7744ab26e32f2",
        "minPlayerLevel": 3,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shootout_Picnic",
        "name": "Shootout Picnic",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5936da9e86f7742d65037edf",
              "name": "Background Check"
            }
          }
        ]
      },
      {
        "id": "66058cb5ae4719735349b9e8",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Easy_Money_-_Part_2",
        "name": "Easy Money - Part 2",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cb22cee99303f1ba067",
              "name": "Easy Money - Part 1"
            }
          }
        ]
      },
      {
        "id": "66058cb7c7f3584787181476",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Balancing_-_Part_1",
        "name": "Balancing - Part 1",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cb5ae4719735349b9e8",
              "name": "Easy Money - Part 2"
            }
          }
        ]
      },
      {
        "id": "66058cb9e8e4f17985230805",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Balancing_-_Part_2",
        "name": "Balancing - Part 2",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cb7c7f3584787181476",
              "name": "Balancing - Part 1"
            }
          }
        ]
      },
      {
        "id": "66058cbb06ef1d50a60c1f46",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Surprise",
        "name": "Surprise",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cb9e8e4f17985230805",
              "name": "Balancing - Part 2"
            }
          }
        ]
      },
      {
        "id": "66058cbd9f59e625462acc8e",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Create_a_Distraction_-_Part_1",
        "name": "Create a Distraction - Part 1",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cbb06ef1d50a60c1f46",
              "name": "Surprise"
            }
          }
        ]
      },
      {
        "id": "66058cbf2f19c31a5a1337ec",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Create_a_Distraction_-_Part_2",
        "name": "Create a Distraction - Part 2",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cbd9f59e625462acc8e",
              "name": "Create a Distraction - Part 1"
            }
          }
        ]
      },
      {
        "id": "66058cc1da30b620a34e6e86",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/To_Great_Heights!_-_Part_1",
        "name": "To Great Heights! - Part 1",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cb7c7f3584787181476",
              "name": "Balancing - Part 1"
            }
          }
        ]
      },
      {
        "id": "66058cc208308761cf390993",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/To_Great_Heights!_-_Part_2",
        "name": "To Great Heights! - Part 2",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cc1da30b620a34e6e86",
              "name": "To Great Heights! - Part 1"
            }
          }
        ]
      },
      {
        "id": "66058cc5bb83da7ba474aba9",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/To_Great_Heights!_-_Part_3",
        "name": "To Great Heights! - Part 3",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cc208308761cf390993",
              "name": "To Great Heights! - Part 2"
            }
          }
        ]
      },
      {
        "id": "66058cc72cee99303f1ba069",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/To_Great_Heights!_-_Part_4",
        "name": "To Great Heights! - Part 4",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cc5bb83da7ba474aba9",
              "name": "To Great Heights! - Part 3"
            }
          }
        ]
      },
      {
        "id": "66058cc9ae4719735349b9ea",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/To_Great_Heights!_-_Part_5",
        "name": "To Great Heights! - Part 5",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cc72cee99303f1ba069",
              "name": "To Great Heights! - Part 4"
            }
          }
        ]
      },
      {
        "id": "66058ccde8e4f17985230807",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Against_the_Conscience_-_Part_2",
        "name": "Against the Conscience - Part 2",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058ccbc7f3584787181478",
              "name": "Against the Conscience - Part 1"
            }
          }
        ]
      },
      {
        "id": "66058ccf06ef1d50a60c1f48",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Between_Two_Fires",
        "name": "Between Two Fires",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058ccde8e4f17985230807",
              "name": "Against the Conscience - Part 2"
            }
          }
        ]
      },
      {
        "id": "66058cd19f59e625462acc90",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Decisions%2C_Decisions",
        "name": "Decisions, Decisions",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058ccf06ef1d50a60c1f48",
              "name": "Between Two Fires"
            }
          }
        ]
      },
      {
        "id": "675c15fbf7da9792a4059871",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Provide_Viewership",
        "name": "Provide Viewership",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cb5ae4719735349b9e8",
              "name": "Easy Money - Part 2"
            }
          }
        ]
      },
      {
        "id": "66058ccbc7f3584787181478",
        "minPlayerLevel": 3,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Against_the_Conscience_-_Part_1",
        "name": "Against the Conscience - Part 1",
        "trader": {
          "name": "Ref"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058cbd9f59e625462acc8e",
              "name": "Create a Distraction - Part 1"
            }
          },
          {
            "task": {
              "id": "66058cc9ae4719735349b9ea",
              "name": "To Great Heights! - Part 5"
            }
          }
        ]
      },
      {
        "id": "59689ee586f7740d1570bbd5",
        "minPlayerLevel": 4,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sanitary_Standards_-_Part_1",
        "name": "Sanitary Standards - Part 1",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5967733e86f774602332fc84",
              "name": "Shortage"
            }
          }
        ]
      },
      {
        "id": "596b36c586f77450d6045ad2",
        "minPlayerLevel": 5,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Supplier",
        "name": "Supplier",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315e270bb0b8dba00cc48",
              "name": "Burning Rubber"
            }
          }
        ]
      },
      {
        "id": "5fd9fad9c1ce6b1a3b486d00",
        "minPlayerLevel": 5,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Search_Mission",
        "name": "Search Mission",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5936d90786f7742b1420ba5b",
              "name": "Debut"
            }
          }
        ]
      },
      {
        "id": "59674eb386f774539f14813a",
        "minPlayerLevel": 5,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Delivery_From_the_Past",
        "name": "Delivery From the Past",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5936da9e86f7742d65037edf",
              "name": "Background Check"
            }
          }
        ]
      },
      {
        "id": "5ac2426c86f774138762edfe",
        "minPlayerLevel": 5,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_2",
        "name": "Gunsmith - Part 2",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac23c6186f7741247042bad",
              "name": "Gunsmith - Part 1"
            }
          }
        ]
      },
      {
        "id": "63a88045abf76d719f42d715",
        "minPlayerLevel": 5,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Delicious_Sausage",
        "name": "The Delicious Sausage",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25b6be86f77444001e1b89",
              "name": "The Survivalist Path - Thrifty"
            }
          }
        ]
      },
      {
        "id": "59c124d686f774189b3c843f",
        "minPlayerLevel": 5,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/BP_Depot",
        "name": "BP Depot",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59674eb386f774539f14813a",
              "name": "Delivery From the Past"
            }
          }
        ]
      },
      {
        "id": "675c3507a06634b5110e3c18",
        "minPlayerLevel": 5,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Belka_and_Strelka",
        "name": "Belka and Strelka",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59c124d686f774189b3c843f",
              "name": "BP Depot"
            }
          }
        ]
      },
      {
        "id": "59689fbd86f7740d137ebfc4",
        "minPlayerLevel": 6,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Operation_Aquarius_-_Part_1",
        "name": "Operation Aquarius - Part 1",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5967733e86f774602332fc84",
              "name": "Shortage"
            }
          }
        ]
      },
      {
        "id": "5967530a86f77462ba22226b",
        "minPlayerLevel": 6,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Bad_Rep_Evidence",
        "name": "Bad Rep Evidence",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59c124d686f774189b3c843f",
              "name": "BP Depot"
            }
          }
        ]
      },
      {
        "id": "5968eb3186f7741dde183a4d",
        "minPlayerLevel": 6,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Operation_Aquarius_-_Part_2",
        "name": "Operation Aquarius - Part 2",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59689fbd86f7740d137ebfc4",
              "name": "Operation Aquarius - Part 1"
            }
          }
        ]
      },
      {
        "id": "5ac2428686f77412450b42bf",
        "minPlayerLevel": 7,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_3",
        "name": "Gunsmith - Part 3",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac23c6186f7741247042bad",
              "name": "Gunsmith - Part 1"
            }
          }
        ]
      },
      {
        "id": "596b43fb86f77457ca186186",
        "minPlayerLevel": 7,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Extortionist",
        "name": "The Extortionist",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596b36c586f77450d6045ad2",
              "name": "Supplier"
            }
          }
        ]
      },
      {
        "id": "596a204686f774576d4c95de",
        "minPlayerLevel": 8,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sanitary_Standards_-_Part_2",
        "name": "Sanitary Standards - Part 2",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59689ee586f7740d1570bbd5",
              "name": "Sanitary Standards - Part 1"
            }
          }
        ]
      },
      {
        "id": "596b455186f77457cb50eccb",
        "minPlayerLevel": 8,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Stirrup",
        "name": "Stirrup",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596b36c586f77450d6045ad2",
              "name": "Supplier"
            }
          }
        ]
      },
      {
        "id": "5979ed3886f77431307dc512",
        "minPlayerLevel": 8,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/What%E2%80%99s_on_the_Flash_Drive%3F",
        "name": "What’s on the Flash Drive?",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596b43fb86f77457ca186186",
              "name": "The Extortionist"
            }
          }
        ]
      },
      {
        "id": "5969f90786f77420d2328015",
        "minPlayerLevel": 8,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Painkiller",
        "name": "Painkiller",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596a204686f774576d4c95de",
              "name": "Sanitary Standards - Part 2"
            }
          }
        ]
      },
      {
        "id": "5979eee086f774311955e614",
        "minPlayerLevel": 8,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Golden_Swag",
        "name": "Golden Swag",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5979ed3886f77431307dc512",
              "name": "What’s on the Flash Drive?"
            }
          }
        ]
      },
      {
        "id": "5a27c99a86f7747d2c6bdd8e",
        "minPlayerLevel": 9,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Friend_From_the_West_-_Part_1",
        "name": "Friend From the West - Part 1",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596b36c586f77450d6045ad2",
              "name": "Supplier"
            }
          }
        ]
      },
      {
        "id": "59675d6c86f7740a842fc482",
        "minPlayerLevel": 9,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Ice_Cream_Cones",
        "name": "Ice Cream Cones",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5967530a86f77462ba22226b",
              "name": "Bad Rep Evidence"
            }
          }
        ]
      },
      {
        "id": "5a27d2af86f7744e1115b323",
        "minPlayerLevel": 9,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Friend_From_the_West_-_Part_2",
        "name": "Friend From the West - Part 2",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27c99a86f7747d2c6bdd8e",
              "name": "Friend From the West - Part 1"
            }
          }
        ]
      },
      {
        "id": "639872f9decada40426d3447",
        "minPlayerLevel": 9,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_4",
        "name": "Gunsmith - Part 4",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac2426c86f774138762edfe",
              "name": "Gunsmith - Part 2"
            }
          },
          {
            "task": {
              "id": "5ac2428686f77412450b42bf",
              "name": "Gunsmith - Part 3"
            }
          }
        ]
      },
      {
        "id": "5ede55112c95834b583f052a",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Bunker_-_Part_1",
        "name": "The Bunker - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59c124d686f774189b3c843f",
              "name": "BP Depot"
            }
          }
        ]
      },
      {
        "id": "639136e84ed9512be67647db",
        "minPlayerLevel": 10,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Cease_Fire!",
        "name": "Cease Fire!",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63a88045abf76d719f42d715",
              "name": "The Delicious Sausage"
            }
          }
        ]
      },
      {
        "id": "5969f9e986f7741dde183a50",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Pharmacist",
        "name": "Pharmacist",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5969f90786f77420d2328015",
              "name": "Painkiller"
            }
          }
        ]
      },
      {
        "id": "5979f9ba86f7740f6c3fe9f2",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Chemical_-_Part_1",
        "name": "Chemical - Part 1",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5979eee086f774311955e614",
              "name": "Golden Swag"
            }
          }
        ]
      },
      {
        "id": "59675ea386f77414b32bded2",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Postman_Pat_-_Part_1",
        "name": "Postman Pat - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59675d6c86f7740a842fc482",
              "name": "Ice Cream Cones"
            }
          }
        ]
      },
      {
        "id": "5a27b75b86f7742e97191958",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Fishing_Gear",
        "name": "Fishing Gear",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27d2af86f7744e1115b323",
              "name": "Friend From the West - Part 2"
            }
          }
        ]
      },
      {
        "id": "5ae3267986f7742a413592fe",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_5",
        "name": "Gunsmith - Part 5",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639872f9decada40426d3447",
              "name": "Gunsmith - Part 4"
            }
          }
        ]
      },
      {
        "id": "596760e186f7741e11214d58",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Postman_Pat_-_Part_2",
        "name": "Postman Pat - Part 2",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59675ea386f77414b32bded2",
              "name": "Postman Pat - Part 1"
            }
          }
        ]
      },
      {
        "id": "596a1e6c86f7741ddc2d3206",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/General_Wares",
        "name": "General Wares",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5969f9e986f7741dde183a50",
              "name": "Pharmacist"
            }
          }
        ]
      },
      {
        "id": "596a218586f77420d232807c",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Car_Repair",
        "name": "Car Repair",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5969f9e986f7741dde183a50",
              "name": "Pharmacist"
            }
          }
        ]
      },
      {
        "id": "5979f8bb86f7743ec214c7a6",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Polikhim_Hobo",
        "name": "Polikhim Hobo",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5979f9ba86f7740f6c3fe9f2",
              "name": "Chemical - Part 1"
            }
          }
        ]
      },
      {
        "id": "597a0b2986f77426d66c0633",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Chemical_-_Part_2",
        "name": "Chemical - Part 2",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5979f9ba86f7740f6c3fe9f2",
              "name": "Chemical - Part 1"
            }
          }
        ]
      },
      {
        "id": "5a27b7a786f774579c3eb376",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Tigr_Safari",
        "name": "Tigr Safari",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b75b86f7742e97191958",
              "name": "Fishing Gear"
            }
          }
        ]
      },
      {
        "id": "5a27b7d686f77460d847e6a6",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Scrap_Metal",
        "name": "Scrap Metal",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b7a786f774579c3eb376",
              "name": "Tigr Safari"
            }
          }
        ]
      },
      {
        "id": "669fa399033a3ce9870338a8",
        "minPlayerLevel": 10,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Possessor",
        "name": "Possessor",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59675ea386f77414b32bded2",
              "name": "Postman Pat - Part 1"
            }
          }
        ]
      },
      {
        "id": "597a0e5786f77426d66c0636",
        "minPlayerLevel": 11,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Chemical_-_Part_3",
        "name": "Chemical - Part 3",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a0b2986f77426d66c0633",
              "name": "Chemical - Part 2"
            }
          }
        ]
      },
      {
        "id": "5a27b80086f774429a5d7e20",
        "minPlayerLevel": 11,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Eagle_Eye",
        "name": "Eagle Eye",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b7d686f77460d847e6a6",
              "name": "Scrap Metal"
            }
          }
        ]
      },
      {
        "id": "597a0f5686f774273b74f676",
        "minPlayerLevel": 11,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Chemical_-_Part_4",
        "name": "Chemical - Part 4",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a0e5786f77426d66c0636",
              "name": "Chemical - Part 3"
            }
          }
        ]
      },
      {
        "id": "597a160786f77477531d39d2",
        "minPlayerLevel": 11,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Out_of_Curiosity",
        "name": "Out of Curiosity",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a0f5686f774273b74f676",
              "name": "Chemical - Part 4"
            }
          }
        ]
      },
      {
        "id": "597a171586f77405ba6887d3",
        "minPlayerLevel": 11,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Big_Customer",
        "name": "Big Customer",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a0f5686f774273b74f676",
              "name": "Chemical - Part 4"
            }
          }
        ]
      },
      {
        "id": "59c9392986f7742f6923add2",
        "minPlayerLevel": 11,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Trust_Regain",
        "name": "Trust Regain",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a160786f77477531d39d2",
              "name": "Out of Curiosity"
            }
          }
        ]
      },
      {
        "id": "59c93e8e86f7742a406989c4",
        "minPlayerLevel": 11,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Loyalty_Buyout",
        "name": "Loyalty Buyout",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a0f5686f774273b74f676",
              "name": "Chemical - Part 4"
            }
          }
        ]
      },
      {
        "id": "59ca1a6286f774509a270942",
        "minPlayerLevel": 11,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/No_Offence",
        "name": "No Offence",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a171586f77405ba6887d3",
              "name": "Big Customer"
            }
          }
        ]
      },
      {
        "id": "5a27b87686f77460de0252a8",
        "minPlayerLevel": 11,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Humanitarian_Supplies",
        "name": "Humanitarian Supplies",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b80086f774429a5d7e20",
              "name": "Eagle Eye"
            }
          }
        ]
      },
      {
        "id": "675c1d6d59b0575973008fc7",
        "minPlayerLevel": 11,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Seizing_the_Initiative",
        "name": "Seizing the Initiative",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b87686f77460de0252a8",
              "name": "Humanitarian Supplies"
            }
          }
        ]
      },
      {
        "id": "5ac345dc86f774288030817f",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Farming_-_Part_1",
        "name": "Farming - Part 1",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac23c6186f7741247042bad",
              "name": "Gunsmith - Part 1"
            }
          }
        ]
      },
      {
        "id": "5ac3467986f7741d6224abc2",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Signal_-_Part_1",
        "name": "Signal - Part 1",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac2426c86f774138762edfe",
              "name": "Gunsmith - Part 2"
            }
          }
        ]
      },
      {
        "id": "639135d89444fb141f4e6eea",
        "minPlayerLevel": 12,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Population_Census",
        "name": "Population Census",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5969f9e986f7741dde183a50",
              "name": "Pharmacist"
            }
          }
        ]
      },
      {
        "id": "5a03153686f77442d90e2171",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spa_Tour_-_Part_1",
        "name": "Spa Tour - Part 1",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b87686f77460de0252a8",
              "name": "Humanitarian Supplies"
            }
          }
        ]
      },
      {
        "id": "5a27b9de86f77464e5044585",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Cult_-_Part_1",
        "name": "The Cult - Part 1",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b87686f77460de0252a8",
              "name": "Humanitarian Supplies"
            }
          }
        ]
      },
      {
        "id": "5a03173786f77451cb427172",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spa_Tour_-_Part_2",
        "name": "Spa Tour - Part 2",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a03153686f77442d90e2171",
              "name": "Spa Tour - Part 1"
            }
          }
        ]
      },
      {
        "id": "5a0327ba86f77456b9154236",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spa_Tour_-_Part_3",
        "name": "Spa Tour - Part 3",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a03173786f77451cb427172",
              "name": "Spa Tour - Part 2"
            }
          }
        ]
      },
      {
        "id": "5a03296886f774569778596a",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spa_Tour_-_Part_4",
        "name": "Spa Tour - Part 4",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a0327ba86f77456b9154236",
              "name": "Spa Tour - Part 3"
            }
          }
        ]
      },
      {
        "id": "5a0449d586f77474e66227b7",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spa_Tour_-_Part_5",
        "name": "Spa Tour - Part 5",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a03296886f774569778596a",
              "name": "Spa Tour - Part 4"
            }
          }
        ]
      },
      {
        "id": "5a27ba9586f7741b543d8e85",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spa_Tour_-_Part_6",
        "name": "Spa Tour - Part 6",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a0449d586f77474e66227b7",
              "name": "Spa Tour - Part 5"
            }
          }
        ]
      },
      {
        "id": "5a27bafb86f7741c73584017",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spa_Tour_-_Part_7",
        "name": "Spa Tour - Part 7",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27ba9586f7741b543d8e85",
              "name": "Spa Tour - Part 6"
            }
          }
        ]
      },
      {
        "id": "5a27bb1e86f7741f27621b7e",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Cargo_X_-_Part_1",
        "name": "Cargo X - Part 1",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bafb86f7741c73584017",
              "name": "Spa Tour - Part 7"
            }
          }
        ]
      },
      {
        "id": "5a27bb3d86f77411ea361a21",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Cargo_X_-_Part_2",
        "name": "Cargo X - Part 2",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bb1e86f7741f27621b7e",
              "name": "Cargo X - Part 1"
            }
          }
        ]
      },
      {
        "id": "5a27bb5986f7741dfb660900",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Cargo_X_-_Part_3",
        "name": "Cargo X - Part 3",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bb3d86f77411ea361a21",
              "name": "Cargo X - Part 2"
            }
          }
        ]
      },
      {
        "id": "5ac3460c86f7742880308185",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Farming_-_Part_2",
        "name": "Farming - Part 2",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac345dc86f774288030817f",
              "name": "Farming - Part 1"
            }
          }
        ]
      },
      {
        "id": "5ac346a886f7744e1b083d67",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Signal_-_Part_2",
        "name": "Signal - Part 2",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3467986f7741d6224abc2",
              "name": "Signal - Part 1"
            }
          }
        ]
      },
      {
        "id": "5ac3475486f7741d6224abd3",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Bad_Habit",
        "name": "Bad Habit",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3460c86f7742880308185",
              "name": "Farming - Part 2"
            }
          }
        ]
      },
      {
        "id": "5ac3477486f7741d651d6885",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Scout",
        "name": "Scout",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac346a886f7744e1b083d67",
              "name": "Signal - Part 2"
            }
          }
        ]
      },
      {
        "id": "61958c366726521dd96828ec",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Cargo_X_-_Part_4",
        "name": "Cargo X - Part 4",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bb5986f7741dfb660900",
              "name": "Cargo X - Part 3"
            }
          }
        ]
      },
      {
        "id": "626bd75e47ea7f506e5493c5",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Broadcast_-_Part_1",
        "name": "Broadcast - Part 1",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3460c86f7742880308185",
              "name": "Farming - Part 2"
            }
          }
        ]
      },
      {
        "id": "64f731ab83cfca080a361e42",
        "minPlayerLevel": 12,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Pets_Won't_Need_It_-_Part_1",
        "name": "Pets Won't Need It - Part 1",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135d89444fb141f4e6eea",
              "name": "Population Census"
            }
          }
        ]
      },
      {
        "id": "6573387d0b26ed4fde798de3",
        "minPlayerLevel": 12,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Pets_Won't_Need_It_-_Part_2",
        "name": "Pets Won't Need It - Part 2",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64f731ab83cfca080a361e42",
              "name": "Pets Won't Need It - Part 1"
            }
          }
        ]
      },
      {
        "id": "669fa394e0c9f9fafa082897",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Forklift_Certified",
        "name": "Forklift Certified",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa39b91b0a8c9680fc467",
              "name": "Black Swan"
            }
          }
        ]
      },
      {
        "id": "669fa395c4c5c04798002497",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Exit_Here",
        "name": "Exit Here",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3477486f7741d651d6885",
              "name": "Scout"
            }
          }
        ]
      },
      {
        "id": "669fa39b91b0a8c9680fc467",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Black_Swan",
        "name": "Black Swan",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3477486f7741d651d6885",
              "name": "Scout"
            }
          }
        ]
      },
      {
        "id": "669fa39c64ea11e84c0642a6",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Walls_Have_Eyes",
        "name": "The Walls Have Eyes",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa395c4c5c04798002497",
              "name": "Exit Here"
            }
          }
        ]
      },
      {
        "id": "669fa39ee749756c920d02c8",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/All_Is_Revealed",
        "name": "All Is Revealed",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa3a1c26f13bd04030f37",
              "name": "Capacity Check"
            }
          }
        ]
      },
      {
        "id": "66aa74571e5e199ecd094f18",
        "minPlayerLevel": 12,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Secrets_of_Polikhim",
        "name": "Secrets of Polikhim",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa3a1c26f13bd04030f37",
              "name": "Capacity Check"
            }
          }
        ]
      },
      {
        "id": "66aba85403e0ee3101042877",
        "minPlayerLevel": 12,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Beneath_The_Streets",
        "name": "Beneath The Streets",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6573387d0b26ed4fde798de3",
              "name": "Pets Won't Need It - Part 2"
            }
          }
        ]
      },
      {
        "id": "675c1570526ff496850895d9",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Passion_for_Ergonomics",
        "name": "Passion for Ergonomics",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3460c86f7742880308185",
              "name": "Farming - Part 2"
            }
          }
        ]
      },
      {
        "id": "60c0c018f7afb4354815096a",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Factory_Chief",
        "name": "The Huntsman Path - Factory Chief",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          },
          {
            "task": {
              "id": "5ac3477486f7741d651d6885",
              "name": "Scout"
            }
          }
        ]
      },
      {
        "id": "5ac3479086f7742880308199",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Insider",
        "name": "Insider",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac2428686f77412450b42bf",
              "name": "Gunsmith - Part 3"
            }
          },
          {
            "task": {
              "id": "5ac3467986f7741d6224abc2",
              "name": "Signal - Part 1"
            }
          }
        ]
      },
      {
        "id": "669fa3a1c26f13bd04030f37",
        "minPlayerLevel": 12,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Capacity_Check",
        "name": "Capacity Check",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa394e0c9f9fafa082897",
              "name": "Forklift Certified"
            }
          },
          {
            "task": {
              "id": "5ac345dc86f774288030817f",
              "name": "Farming - Part 1"
            }
          }
        ]
      },
      {
        "id": "596a0e1686f7741ddf17dbee",
        "minPlayerLevel": 13,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Supply_Plans",
        "name": "Supply Plans",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5969f9e986f7741dde183a50",
              "name": "Pharmacist"
            }
          }
        ]
      },
      {
        "id": "596a101f86f7741ddb481582",
        "minPlayerLevel": 13,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Kind_of_Sabotage",
        "name": "Kind of Sabotage",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596a0e1686f7741ddf17dbee",
              "name": "Supply Plans"
            }
          }
        ]
      },
      {
        "id": "5d25e2ee86f77443e35162ea",
        "minPlayerLevel": 13,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Woods_Keeper",
        "name": "The Huntsman Path - Woods Keeper",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2b486f77409de05bba0",
              "name": "The Huntsman Path - Secured Perimeter"
            }
          },
          {
            "task": {
              "id": "596a0e1686f7741ddf17dbee",
              "name": "Supply Plans"
            }
          }
        ]
      },
      {
        "id": "5ae3270f86f77445ba41d4dd",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_6",
        "name": "Gunsmith - Part 6",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae3267986f7742a413592fe",
              "name": "Gunsmith - Part 5"
            }
          }
        ]
      },
      {
        "id": "6086c852c945025d41566124",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Revision_-_Reserve",
        "name": "Revision - Reserve",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b87686f77460de0252a8",
              "name": "Humanitarian Supplies"
            }
          }
        ]
      },
      {
        "id": "5a27bb8386f7741c770d2d0a",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Wet_Job_-_Part_1",
        "name": "Wet Job - Part 1",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bafb86f7741c73584017",
              "name": "Spa Tour - Part 7"
            }
          }
        ]
      },
      {
        "id": "5ac3462b86f7741d6118b983",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Farming_-_Part_3",
        "name": "Farming - Part 3",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3460c86f7742880308185",
              "name": "Farming - Part 2"
            }
          }
        ]
      },
      {
        "id": "6089736efa70fc097863b8f6",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Back_Door",
        "name": "Back Door",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3477486f7741d651d6885",
              "name": "Scout"
            }
          }
        ]
      },
      {
        "id": "5a27bbf886f774333a418eeb",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Wet_Job_-_Part_2",
        "name": "Wet Job - Part 2",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bb8386f7741c770d2d0a",
              "name": "Wet Job - Part 1"
            }
          }
        ]
      },
      {
        "id": "5a27bc1586f7741f6d40fa2f",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Wet_Job_-_Part_3",
        "name": "Wet Job - Part 3",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bbf886f774333a418eeb",
              "name": "Wet Job - Part 2"
            }
          }
        ]
      },
      {
        "id": "5a27bc3686f7741c73584026",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Wet_Job_-_Part_4",
        "name": "Wet Job - Part 4",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bc1586f7741f6d40fa2f",
              "name": "Wet Job - Part 3"
            }
          }
        ]
      },
      {
        "id": "5a27bc6986f7741c7358402b",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Wet_Job_-_Part_5",
        "name": "Wet Job - Part 5",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bc3686f7741c73584026",
              "name": "Wet Job - Part 4"
            }
          }
        ]
      },
      {
        "id": "5a27bc8586f7741b543d8ea4",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Wet_Job_-_Part_6",
        "name": "Wet Job - Part 6",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bc6986f7741c7358402b",
              "name": "Wet Job - Part 5"
            }
          }
        ]
      },
      {
        "id": "5ac3464c86f7741d651d6877",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Farming_-_Part_4",
        "name": "Farming - Part 4",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3462b86f7741d6118b983",
              "name": "Farming - Part 3"
            }
          }
        ]
      },
      {
        "id": "5c0bde0986f77479cf22c2f8",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/A_Shooter_Born_in_Heaven",
        "name": "A Shooter Born in Heaven",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3462b86f7741d6118b983",
              "name": "Farming - Part 3"
            }
          }
        ]
      },
      {
        "id": "5d6fbc2886f77449d825f9d3",
        "minPlayerLevel": 14,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Mentor",
        "name": "Mentor",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bc6986f7741c7358402b",
              "name": "Wet Job - Part 5"
            }
          }
        ]
      },
      {
        "id": "60896888e4a85c72ef3fa300",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Classified_Technologies",
        "name": "Classified Technologies",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6086c852c945025d41566124",
              "name": "Revision - Reserve"
            }
          }
        ]
      },
      {
        "id": "6089732b59b92115597ad789",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Surplus_Goods",
        "name": "Surplus Goods",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6089736efa70fc097863b8f6",
              "name": "Back Door"
            }
          }
        ]
      },
      {
        "id": "6179b4d1bca27a099552e04e",
        "minPlayerLevel": 14,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Revision_-_Lighthouse",
        "name": "Revision - Lighthouse",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6086c852c945025d41566124",
              "name": "Revision - Reserve"
            }
          }
        ]
      },
      {
        "id": "5ae448a386f7744d3730fff0",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Only_Business",
        "name": "Only Business",
        "trader": {
          "name": "Ragman"
        }
      },
      {
        "id": "67a09636b8725511260bc421",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shady_Contractor",
        "name": "Shady Contractor",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315e4a6af4ab4b50f3459",
              "name": "Saving the Mole"
            }
          }
        ]
      },
      {
        "id": "665eeacf5d86b6c8aa03c79b",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Thirsty_-_Hounds",
        "name": "Thirsty - Hounds",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63a88045abf76d719f42d715",
              "name": "The Delicious Sausage"
            }
          }
        ]
      },
      {
        "id": "5967725e86f774601a446662",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shaking_Up_the_Teller",
        "name": "Shaking Up the Teller",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59675d6c86f7740a842fc482",
              "name": "Ice Cream Cones"
            }
          }
        ]
      },
      {
        "id": "5ede567cfa6dc072ce15d6e3",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Bunker_-_Part_2",
        "name": "The Bunker - Part 2",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ede55112c95834b583f052a",
              "name": "The Bunker - Part 1"
            }
          }
        ]
      },
      {
        "id": "60896e28e4a85c72ef3fa301",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Disease_History",
        "name": "Disease History",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5969f9e986f7741dde183a50",
              "name": "Pharmacist"
            }
          }
        ]
      },
      {
        "id": "6391359b9444fb141f4e6ee6",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/You've_Got_Mail",
        "name": "You've Got Mail",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59675ea386f77414b32bded2",
              "name": "Postman Pat - Part 1"
            }
          }
        ]
      },
      {
        "id": "6089743983426423753cd58a",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Safe_Corridor",
        "name": "Safe Corridor",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a0f5686f774273b74f676",
              "name": "Chemical - Part 4"
            }
          }
        ]
      },
      {
        "id": "5ac346cf86f7741d63233a02",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Signal_-_Part_3",
        "name": "Signal - Part 3",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac346a886f7744e1b083d67",
              "name": "Signal - Part 2"
            }
          }
        ]
      },
      {
        "id": "6179aff8f57fb279792c60a1",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Overpopulation",
        "name": "Overpopulation",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a03153686f77442d90e2171",
              "name": "Spa Tour - Part 1"
            }
          }
        ]
      },
      {
        "id": "63913715f8e5dd32bf4e3aaa",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Broadcast_-_Part_2",
        "name": "Broadcast - Part 2",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "626bd75e47ea7f506e5493c5",
              "name": "Broadcast - Part 1"
            }
          }
        ]
      },
      {
        "id": "63ab180c87413d64ae0ac20a",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Dangerous_Road",
        "name": "Dangerous Road",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596a0e1686f7741ddf17dbee",
              "name": "Supply Plans"
            }
          }
        ]
      },
      {
        "id": "5ac244eb86f7741356335af1",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_7",
        "name": "Gunsmith - Part 7",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae3270f86f77445ba41d4dd",
              "name": "Gunsmith - Part 6"
            }
          }
        ]
      },
      {
        "id": "5ac346e886f7741d6118b99b",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Signal_-_Part_4",
        "name": "Signal - Part 4",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac346cf86f7741d63233a02",
              "name": "Signal - Part 3"
            }
          }
        ]
      },
      {
        "id": "64ee9df4496db64f9b7a4432",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Door",
        "name": "The Door",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac346cf86f7741d63233a02",
              "name": "Signal - Part 3"
            }
          }
        ]
      },
      {
        "id": "6578ec473dbd035d04531a8d",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Steady_Signal",
        "name": "Steady Signal",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac346e886f7741d6118b99b",
              "name": "Signal - Part 4"
            }
          }
        ]
      },
      {
        "id": "665eec1f5e47a79f8605565a",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Thirsty_-_Breadwinner",
        "name": "Thirsty - Breadwinner",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "665eeacf5d86b6c8aa03c79b",
              "name": "Thirsty - Hounds"
            }
          }
        ]
      },
      {
        "id": "665eec4a4dfc83b0ed0a9dca",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Thirsty_-_Delivery",
        "name": "Thirsty - Delivery",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "665eec1f5e47a79f8605565a",
              "name": "Thirsty - Breadwinner"
            }
          }
        ]
      },
      {
        "id": "665eeca45d86b6c8aa03c79d",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Thirsty_-_Echo",
        "name": "Thirsty - Echo",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "665eec4a4dfc83b0ed0a9dca",
              "name": "Thirsty - Delivery"
            }
          }
        ]
      },
      {
        "id": "665eeca92f7aedcc900b0437",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Thirsty_-_Secrets",
        "name": "Thirsty - Secrets",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "665eeca45d86b6c8aa03c79d",
              "name": "Thirsty - Echo"
            }
          }
        ]
      },
      {
        "id": "669fa38fad7f1eac2607ed46",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/One_Less_Loose_End",
        "name": "One Less Loose End",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6179aff8f57fb279792c60a1",
              "name": "Overpopulation"
            }
          }
        ]
      },
      {
        "id": "669fa3910c828825de06d69f",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/A_Healthy_Alternative",
        "name": "A Healthy Alternative",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa38fad7f1eac2607ed46",
              "name": "One Less Loose End"
            }
          }
        ]
      },
      {
        "id": "669fa3a08b4a64b332041ff7",
        "minPlayerLevel": 15,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Dragnet",
        "name": "Dragnet",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa38fad7f1eac2607ed46",
              "name": "One Less Loose End"
            }
          }
        ]
      },
      {
        "id": "67a0964e972c11a3f507731b",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Needle_in_a_Haystack",
        "name": "Needle in a Haystack",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a09636b8725511260bc421",
              "name": "Shady Contractor"
            }
          }
        ]
      },
      {
        "id": "67a096577e86e067eb045733",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hidden_Layer",
        "name": "Hidden Layer",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0964e972c11a3f507731b",
              "name": "Needle in a Haystack"
            }
          }
        ]
      },
      {
        "id": "67a0966817e34930e500754c",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Forced_Alliance",
        "name": "Forced Alliance",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a096577e86e067eb045733",
              "name": "Hidden Layer"
            }
          }
        ]
      },
      {
        "id": "67a09673972c11a3f507731d",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Tarkov_Butcher",
        "name": "The Tarkov Butcher",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0966817e34930e500754c",
              "name": "Forced Alliance"
            }
          }
        ]
      },
      {
        "id": "67a0967c003a9986cb0f5ac1",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sensory_Analysis_-_Part_1",
        "name": "Sensory Analysis - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a096577e86e067eb045733",
              "name": "Hidden Layer"
            }
          }
        ]
      },
      {
        "id": "67a096ed77dd677f600804ba",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sensory_Analysis_-_Part_2",
        "name": "Sensory Analysis - Part 2",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0967c003a9986cb0f5ac1",
              "name": "Sensory Analysis - Part 1"
            }
          }
        ]
      },
      {
        "id": "67a096f605d1611ed90be75a",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hot_Zone",
        "name": "Hot Zone",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0967c003a9986cb0f5ac1",
              "name": "Sensory Analysis - Part 1"
            }
          }
        ]
      },
      {
        "id": "67a0970744893b9f3f0d9b68",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Offensive_Reconnaissance",
        "name": "Offensive Reconnaissance",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0966817e34930e500754c",
              "name": "Forced Alliance"
            }
          }
        ]
      },
      {
        "id": "67a0970f05d1611ed90be75d",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hypotheses_Testing",
        "name": "Hypotheses Testing",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0970744893b9f3f0d9b68",
              "name": "Offensive Reconnaissance"
            }
          }
        ]
      },
      {
        "id": "67a09724972c11a3f5077324",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Confidential_Info",
        "name": "Confidential Info",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0970744893b9f3f0d9b68",
              "name": "Offensive Reconnaissance"
            }
          }
        ]
      },
      {
        "id": "67a0972e77dd677f600804bd",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/This_Tape_Sucks",
        "name": "This Tape Sucks",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0970744893b9f3f0d9b68",
              "name": "Offensive Reconnaissance"
            }
          }
        ]
      },
      {
        "id": "67a097379f2068e74603c6ac",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Indisputable_Authority",
        "name": "Indisputable Authority",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0970744893b9f3f0d9b68",
              "name": "Offensive Reconnaissance"
            }
          }
        ]
      },
      {
        "id": "67d03be712fb5f8fd2096332",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Vacate_the_Premises",
        "name": "Vacate the Premises",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a0970744893b9f3f0d9b68",
              "name": "Offensive Reconnaissance"
            }
          }
        ]
      },
      {
        "id": "67a09761e720611a6a01f288",
        "minPlayerLevel": 15,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Keeper's_Word",
        "name": "Keeper's Word",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67a096ed77dd677f600804ba",
              "name": "Sensory Analysis - Part 2"
            }
          },
          {
            "task": {
              "id": "67a096f605d1611ed90be75a",
              "name": "Hot Zone"
            }
          },
          {
            "task": {
              "id": "67a09673972c11a3f507731d",
              "name": "The Tarkov Butcher"
            }
          },
          {
            "task": {
              "id": "67a0970f05d1611ed90be75d",
              "name": "Hypotheses Testing"
            }
          },
          {
            "task": {
              "id": "67d03be712fb5f8fd2096332",
              "name": "Vacate the Premises"
            }
          },
          {
            "task": {
              "id": "67a09724972c11a3f5077324",
              "name": "Confidential Info"
            }
          },
          {
            "task": {
              "id": "67a097379f2068e74603c6ac",
              "name": "Indisputable Authority"
            }
          },
          {
            "task": {
              "id": "67a0972e77dd677f600804bd",
              "name": "This Tape Sucks"
            }
          }
        ]
      },
      {
        "id": "639135e0fa894f0a866afde6",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Urban_Medicine",
        "name": "Urban Medicine",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135d89444fb141f4e6eea",
              "name": "Population Census"
            }
          }
        ]
      },
      {
        "id": "6179b3bdc7560e13d23eeb8d",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Corporate_Secrets",
        "name": "Corporate Secrets",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3462b86f7741d6118b983",
              "name": "Farming - Part 3"
            }
          }
        ]
      },
      {
        "id": "639135f286e646067c176a87",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Revision_-_Streets_of_Tarkov",
        "name": "Revision - Streets of Tarkov",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6086c852c945025d41566124",
              "name": "Revision - Reserve"
            }
          }
        ]
      },
      {
        "id": "59c50a9e86f7745fef66f4ff",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Punisher_-_Part_1",
        "name": "The Punisher - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5967725e86f774601a446662",
              "name": "Shaking Up the Teller"
            }
          }
        ]
      },
      {
        "id": "5ae3277186f7745973054106",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_8",
        "name": "Gunsmith - Part 8",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac244eb86f7741356335af1",
              "name": "Gunsmith - Part 7"
            }
          }
        ]
      },
      {
        "id": "5ae448bf86f7744d733e55ee",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_ULTRA_Great_Again",
        "name": "Make ULTRA Great Again",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448a386f7744d3730fff0",
              "name": "Only Business"
            }
          }
        ]
      },
      {
        "id": "5ae448e586f7744dcf0c2a67",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Big_Sale",
        "name": "Big Sale",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448a386f7744d3730fff0",
              "name": "Only Business"
            }
          }
        ]
      },
      {
        "id": "60896bca6ee58f38c417d4f2",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/No_Place_for_Renegades",
        "name": "No Place for Renegades",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ede567cfa6dc072ce15d6e3",
              "name": "The Bunker - Part 2"
            }
          }
        ]
      },
      {
        "id": "6179ad56c760af5ad2053587",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Seaside_Vacation",
        "name": "Seaside Vacation",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "60896e28e4a85c72ef3fa301",
              "name": "Disease History"
            }
          }
        ]
      },
      {
        "id": "638fcd23dc65553116701d33",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Audit",
        "name": "Audit",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448a386f7744d3730fff0",
              "name": "Only Business"
            }
          }
        ]
      },
      {
        "id": "639135b04ed9512be67647d7",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Glory_to_CPSU_-_Part_1",
        "name": "Glory to CPSU - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6391359b9444fb141f4e6ee6",
              "name": "You've Got Mail"
            }
          }
        ]
      },
      {
        "id": "676529af9c90953d090882e7",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Old_Friend's_Request",
        "name": "Gunsmith - Old Friend's Request",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac244eb86f7741356335af1",
              "name": "Gunsmith - Part 7"
            }
          }
        ]
      },
      {
        "id": "5ae4490786f7744ca822adcc",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Dressed_to_Kill",
        "name": "Dressed to Kill",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448f286f77448d73c0131",
              "name": "The Blood of War - Part 1"
            }
          }
        ]
      },
      {
        "id": "5ae4493d86f7744b8e15aa8f",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Database_-_Part_2",
        "name": "Database - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4493486f7744efa289417",
              "name": "Database - Part 1"
            }
          }
        ]
      },
      {
        "id": "608974af4b05530f55550c21",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Inventory_Check",
        "name": "Inventory Check",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "608974d01a66564e74191fc0",
              "name": "A Fuel Matter"
            }
          }
        ]
      },
      {
        "id": "608974d01a66564e74191fc0",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/A_Fuel_Matter",
        "name": "A Fuel Matter",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448f286f77448d73c0131",
              "name": "The Blood of War - Part 1"
            }
          }
        ]
      },
      {
        "id": "65802b627b44fa5e14638899",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Nothing_Fishy_About_This",
        "name": "Nothing Fishy About This",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448e586f7744dcf0c2a67",
              "name": "Big Sale"
            }
          }
        ]
      },
      {
        "id": "66aa58245ab22944110db6e9",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/New_Day%2C_New_Paths",
        "name": "New Day, New Paths",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135f286e646067c176a87",
              "name": "Revision - Streets of Tarkov"
            }
          }
        ]
      },
      {
        "id": "675c03d1f7da9792a405549a",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Abandoned_Cargo",
        "name": "Abandoned Cargo",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6179ad56c760af5ad2053587",
              "name": "Seaside Vacation"
            }
          }
        ]
      },
      {
        "id": "675c047fa46173572a0bd878",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shipment_Tracking",
        "name": "Shipment Tracking",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "675c03d1f7da9792a405549a",
              "name": "Abandoned Cargo"
            }
          }
        ]
      },
      {
        "id": "675c04f4db8807b75d0f38e8",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Closer_to_the_People",
        "name": "Closer to the People",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "675c047fa46173572a0bd878",
              "name": "Shipment Tracking"
            }
          }
        ]
      },
      {
        "id": "675c085d59b0575973005f52",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Break_the_Deal",
        "name": "Break the Deal",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448bf86f7744d733e55ee",
              "name": "Make ULTRA Great Again"
            }
          }
        ]
      },
      {
        "id": "64e7b971f9d6fa49d6769b44",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Big_Game",
        "name": "The Huntsman Path - Big Game",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          },
          {
            "task": {
              "id": "639135e0fa894f0a866afde6",
              "name": "Urban Medicine"
            }
          }
        ]
      },
      {
        "id": "64f3176921045e77405d63b5",
        "minPlayerLevel": 17,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Ambulances_Again",
        "name": "Ambulances Again",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639136e84ed9512be67647db",
              "name": "Cease Fire!"
            }
          },
          {
            "task": {
              "id": "639135e0fa894f0a866afde6",
              "name": "Urban Medicine"
            }
          }
        ]
      },
      {
        "id": "5ae448f286f77448d73c0131",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Blood_of_War_-_Part_1",
        "name": "The Blood of War - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448e586f7744dcf0c2a67",
              "name": "Big Sale"
            }
          },
          {
            "task": {
              "id": "5ae448bf86f7744d733e55ee",
              "name": "Make ULTRA Great Again"
            }
          }
        ]
      },
      {
        "id": "5ae4493486f7744efa289417",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Database_-_Part_1",
        "name": "Database - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448e586f7744dcf0c2a67",
              "name": "Big Sale"
            }
          },
          {
            "task": {
              "id": "5ae448bf86f7744d733e55ee",
              "name": "Make ULTRA Great Again"
            }
          }
        ]
      },
      {
        "id": "5ae449b386f77446d8741719",
        "minPlayerLevel": 17,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gratitude",
        "name": "Gratitude",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4490786f7744ca822adcc",
              "name": "Dressed to Kill"
            }
          },
          {
            "task": {
              "id": "5ae4493d86f7744b8e15aa8f",
              "name": "Database - Part 2"
            }
          }
        ]
      },
      {
        "id": "5c1234c286f77406fa13baeb",
        "minPlayerLevel": 18,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Setup",
        "name": "Setup",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27d2af86f7744e1115b323",
              "name": "Friend From the West - Part 2"
            }
          }
        ]
      },
      {
        "id": "5a27ba1c86f77461ea5a3c56",
        "minPlayerLevel": 18,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Cult_-_Part_2",
        "name": "The Cult - Part 2",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b9de86f77464e5044585",
              "name": "The Cult - Part 1"
            }
          }
        ]
      },
      {
        "id": "59c50c8886f7745fed3193bf",
        "minPlayerLevel": 18,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Punisher_-_Part_2",
        "name": "The Punisher - Part 2",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59c50a9e86f7745fef66f4ff",
              "name": "The Punisher - Part 1"
            }
          }
        ]
      },
      {
        "id": "6179ac7511973d018217d0b9",
        "minPlayerLevel": 18,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Easy_Job_-_Part_1",
        "name": "Easy Job - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59c50c8886f7745fed3193bf",
              "name": "The Punisher - Part 2"
            }
          }
        ]
      },
      {
        "id": "6179acbdc760af5ad2053585",
        "minPlayerLevel": 18,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Easy_Job_-_Part_2",
        "name": "Easy Job - Part 2",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6179ac7511973d018217d0b9",
              "name": "Easy Job - Part 1"
            }
          }
        ]
      },
      {
        "id": "626bd75c71bd851e971b82a5",
        "minPlayerLevel": 18,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Reconnaissance",
        "name": "Reconnaissance",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6179ac7511973d018217d0b9",
              "name": "Easy Job - Part 1"
            }
          }
        ]
      },
      {
        "id": "60896b7bfa70fc097863b8f5",
        "minPlayerLevel": 19,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Documents",
        "name": "Documents",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "60896bca6ee58f38c417d4f2",
              "name": "No Place for Renegades"
            }
          }
        ]
      },
      {
        "id": "639872fa9b4fb827b200d8e5",
        "minPlayerLevel": 19,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_9",
        "name": "Gunsmith - Part 9",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae3277186f7745973054106",
              "name": "Gunsmith - Part 8"
            }
          }
        ]
      },
      {
        "id": "59c512ad86f7741f0d09de9b",
        "minPlayerLevel": 19,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Punisher_-_Part_3",
        "name": "The Punisher - Part 3",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59c50c8886f7745fed3193bf",
              "name": "The Punisher - Part 2"
            }
          }
        ]
      },
      {
        "id": "66ab970848ddbe9d4a0c49a8",
        "minPlayerLevel": 19,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Special_Comms",
        "name": "Special Comms",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "60896b7bfa70fc097863b8f5",
              "name": "Documents"
            }
          }
        ]
      },
      {
        "id": "5c0d190cd09282029f5390d8",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Grenadier",
        "name": "Grenadier",
        "trader": {
          "name": "Prapor"
        }
      },
      {
        "id": "6752f6d83038f7df520c83e8",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/A_Helping_Hand",
        "name": "A Helping Hand",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315e4a6af4ab4b50f3459",
              "name": "Saving the Mole"
            }
          }
        ]
      },
      {
        "id": "5d25e48186f77443e625e386",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Courtesy_Visit",
        "name": "Courtesy Visit",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25cf2686f77443e75488d4",
              "name": "The Survivalist Path - Tough Guy"
            }
          }
        ]
      },
      {
        "id": "5d25e4d586f77443e625e388",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Reserve_(quest)",
        "name": "Reserve",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63a88045abf76d719f42d715",
              "name": "The Delicious Sausage"
            }
          }
        ]
      },
      {
        "id": "6193850f60b34236ee0483de",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Long_Road",
        "name": "Long Road",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27d2af86f7744e1115b323",
              "name": "Friend From the West - Part 2"
            }
          }
        ]
      },
      {
        "id": "5a68661a86f774500f48afb0",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Health_Care_Privacy_-_Part_1",
        "name": "Health Care Privacy - Part 1",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5969f9e986f7741dde183a50",
              "name": "Pharmacist"
            }
          }
        ]
      },
      {
        "id": "5d25e48d86f77408251c4bfb",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shady_Business",
        "name": "Shady Business",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d24b81486f77439c92d6ba8",
              "name": "Acquaintance"
            }
          },
          {
            "task": {
              "id": "5979ed3886f77431307dc512",
              "name": "What’s on the Flash Drive?"
            }
          }
        ]
      },
      {
        "id": "639136d68ba6894d155e77cf",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Green_Corridor",
        "name": "Green Corridor",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bafb86f7741c73584017",
              "name": "Spa Tour - Part 7"
            }
          }
        ]
      },
      {
        "id": "639282134ed9512be67647ed",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Road_Closed",
        "name": "Road Closed",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bafb86f7741c73584017",
              "name": "Spa Tour - Part 7"
            }
          }
        ]
      },
      {
        "id": "639136fa9444fb141f4e6eee",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Watching_You",
        "name": "Watching You",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63913715f8e5dd32bf4e3aaa",
              "name": "Broadcast - Part 2"
            }
          }
        ]
      },
      {
        "id": "63a511ea30d85e10e375b045",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Broadcast_-_Part_3",
        "name": "Broadcast - Part 3",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63913715f8e5dd32bf4e3aaa",
              "name": "Broadcast - Part 2"
            }
          }
        ]
      },
      {
        "id": "639135a7e705511c8a4a1b78",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Ballet_Lover",
        "name": "Ballet Lover",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "638fcd23dc65553116701d33",
              "name": "Audit"
            }
          }
        ]
      },
      {
        "id": "59ca264786f77445a80ed044",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Punisher_-_Part_4",
        "name": "The Punisher - Part 4",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59c512ad86f7741f0d09de9b",
              "name": "The Punisher - Part 3"
            }
          }
        ]
      },
      {
        "id": "5ae327c886f7745c7b3f2f3f",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_10",
        "name": "Gunsmith - Part 10",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639872fa9b4fb827b200d8e5",
              "name": "Gunsmith - Part 9"
            }
          }
        ]
      },
      {
        "id": "59ca29fb86f77445ab465c87",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Punisher_-_Part_5",
        "name": "The Punisher - Part 5",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca264786f77445a80ed044",
              "name": "The Punisher - Part 4"
            }
          }
        ]
      },
      {
        "id": "5a68663e86f774501078f78a",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Health_Care_Privacy_-_Part_2",
        "name": "Health Care Privacy - Part 2",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68661a86f774500f48afb0",
              "name": "Health Care Privacy - Part 1"
            }
          }
        ]
      },
      {
        "id": "5a68665c86f774255929b4c7",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Health_Care_Privacy_-_Part_3",
        "name": "Health Care Privacy - Part 3",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68663e86f774501078f78a",
              "name": "Health Care Privacy - Part 2"
            }
          }
        ]
      },
      {
        "id": "5a68667486f7742607157d28",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Health_Care_Privacy_-_Part_4",
        "name": "Health Care Privacy - Part 4",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68665c86f774255929b4c7",
              "name": "Health Care Privacy - Part 3"
            }
          }
        ]
      },
      {
        "id": "5a68669a86f774255929b4d4",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Health_Care_Privacy_-_Part_5",
        "name": "Health Care Privacy - Part 5",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68667486f7742607157d28",
              "name": "Health Care Privacy - Part 4"
            }
          }
        ]
      },
      {
        "id": "5d25e44f86f77443e625e385",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Eraser_-_Part_1",
        "name": "The Huntsman Path - Eraser - Part 1",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "608a768d82e40b3c727fd17d",
              "name": "Pest Control"
            }
          }
        ]
      },
      {
        "id": "5d6fb2c086f77449da599c24",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/An_Apple_a_Day_Keeps_the_Doctor_Away",
        "name": "An Apple a Day Keeps the Doctor Away",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68667486f7742607157d28",
              "name": "Health Care Privacy - Part 4"
            }
          }
        ]
      },
      {
        "id": "608a768d82e40b3c727fd17d",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Pest_Control",
        "name": "Pest Control",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e4d586f77443e625e388",
              "name": "Reserve"
            }
          }
        ]
      },
      {
        "id": "61904daa7d0d857927447b9c",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Hermit",
        "name": "The Hermit",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e48186f77443e625e386",
              "name": "Courtesy Visit"
            }
          }
        ]
      },
      {
        "id": "669fa3a3ad7f1eac2607ed48",
        "minPlayerLevel": 20,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Health_Care_Privacy_-_Part_6",
        "name": "Health Care Privacy - Part 6",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68669a86f774255929b4d4",
              "name": "Health Care Privacy - Part 5"
            }
          }
        ]
      },
      {
        "id": "673f2cd5d3346c2167020484",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shipping_Delay_-_Part_2",
        "name": "Shipping Delay - Part 2",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6752f6d83038f7df520c83e8",
              "name": "A Helping Hand"
            }
          }
        ]
      },
      {
        "id": "673f348dd3346c21670217e7",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Shipping_Delay_-_Part_1",
        "name": "Shipping Delay - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6752f6d83038f7df520c83e8",
              "name": "A Helping Hand"
            }
          }
        ]
      },
      {
        "id": "673f4e956f1b89c7bc0f56ef",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hot_Wheels",
        "name": "Hot Wheels",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "673f2cd5d3346c2167020484",
              "name": "Shipping Delay - Part 2"
            }
          }
        ]
      },
      {
        "id": "673f5a4976553f78350bdac1",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hot_Wheels_-_Let's_Try_Again",
        "name": "Hot Wheels - Let's Try Again",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "673f4e956f1b89c7bc0f56ef",
              "name": "Hot Wheels"
            }
          }
        ]
      },
      {
        "id": "673f6027352b4da8e00322d2",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Inevitable_Response",
        "name": "Inevitable Response",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "673f5a4976553f78350bdac1",
              "name": "Hot Wheels - Let's Try Again"
            }
          }
        ]
      },
      {
        "id": "673f61a066e6a521aa04b62b",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Order_From_Outside",
        "name": "Order From Outside",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "673f6027352b4da8e00322d2",
              "name": "Inevitable Response"
            }
          }
        ]
      },
      {
        "id": "673f629c5b555b53460cf827",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Building_Foundations",
        "name": "Building Foundations",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6745fcded0fbbc74ca0f721d",
              "name": "Swift Retribution"
            }
          }
        ]
      },
      {
        "id": "6740a02a69a58fceba0ff399",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Natural_Exchange",
        "name": "Natural Exchange",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "673f629c5b555b53460cf827",
              "name": "Building Foundations"
            }
          }
        ]
      },
      {
        "id": "6740a2c17e3818d5bb0648b6",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Half-Empty",
        "name": "Half-Empty",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6740a15566e6a521aa051b15",
              "name": "Forge a Friendship"
            }
          }
        ]
      },
      {
        "id": "6740a3f4eca8acb2d2055159",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Stick_in_the_Wheel",
        "name": "Stick in the Wheel",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6740a2c17e3818d5bb0648b6",
              "name": "Half-Empty"
            }
          }
        ]
      },
      {
        "id": "674492b6909d2013670a347a",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Ask_for_Directions",
        "name": "Ask for Directions",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6740b60c60a98cad1b0e0aa0",
              "name": "Another Shipping Delay"
            }
          }
        ]
      },
      {
        "id": "6744a4717e3818d5bb0680bb",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Stabilize_Business",
        "name": "Stabilize Business",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "674492b6909d2013670a347a",
              "name": "Ask for Directions"
            }
          }
        ]
      },
      {
        "id": "6744a728352b4da8e003eda9",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Battery_Change",
        "name": "Battery Change",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6740a3f4eca8acb2d2055159",
              "name": "Stick in the Wheel"
            }
          }
        ]
      },
      {
        "id": "6744a9dfef61d56e020b5c4a",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Battery_Change",
        "name": "Battery Change",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6744a4717e3818d5bb0680bb",
              "name": "Stabilize Business"
            }
          }
        ]
      },
      {
        "id": "6744ab1def61d56e020b5c56",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Protect_the_Sky",
        "name": "Protect the Sky",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6744a728352b4da8e003eda9",
              "name": "Battery Change"
            }
          }
        ]
      },
      {
        "id": "6744aca8d3346c216702c583",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Discombobulate",
        "name": "Discombobulate",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6744ab1def61d56e020b5c56",
              "name": "Protect the Sky"
            }
          }
        ]
      },
      {
        "id": "6745fae369a58fceba10343d",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Higher_They_Fly",
        "name": "The Higher They Fly",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "673f629c5b555b53460cf827",
              "name": "Building Foundations"
            }
          }
        ]
      },
      {
        "id": "6745fcded0fbbc74ca0f721d",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Swift_Retribution",
        "name": "Swift Retribution",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "673f4e956f1b89c7bc0f56ef",
              "name": "Hot Wheels"
            }
          }
        ]
      },
      {
        "id": "6745fdddd3346c216702e0bf",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Simple_Side_Job",
        "name": "Simple Side Job",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6745fcded0fbbc74ca0f721d",
              "name": "Swift Retribution"
            }
          }
        ]
      },
      {
        "id": "674600a366e6a521aa05eb66",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Route_Deviation",
        "name": "Route Deviation",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6745fae369a58fceba10343d",
              "name": "The Higher They Fly"
            }
          }
        ]
      },
      {
        "id": "674602307e3818d5bb069489",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hindsight_20%2F20",
        "name": "Hindsight 20/20",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "674600a366e6a521aa05eb66",
              "name": "Route Deviation"
            }
          }
        ]
      },
      {
        "id": "6746053b5b555b53460d9896",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Key_Partner",
        "name": "Key Partner",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "674602307e3818d5bb069489",
              "name": "Hindsight 20/20"
            }
          }
        ]
      },
      {
        "id": "674605df60a98cad1b0ec799",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Killer_Argument",
        "name": "Killer Argument",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6746053b5b555b53460d9896",
              "name": "Key Partner"
            }
          }
        ]
      },
      {
        "id": "6740a15566e6a521aa051b15",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Forge_a_Friendship",
        "name": "Forge a Friendship",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6745fcded0fbbc74ca0f721d",
              "name": "Swift Retribution"
            }
          },
          {
            "task": {
              "id": "6740a02a69a58fceba0ff399",
              "name": "Natural Exchange"
            }
          }
        ]
      },
      {
        "id": "6740b60c60a98cad1b0e0aa0",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Another_Shipping_Delay",
        "name": "Another Shipping Delay",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6740a02a69a58fceba0ff399",
              "name": "Natural Exchange"
            }
          },
          {
            "task": {
              "id": "673f6027352b4da8e00322d2",
              "name": "Inevitable Response"
            }
          }
        ]
      },
      {
        "id": "6744af0969a58fceba101fed",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Price_of_Independence",
        "name": "The Price of Independence",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6744a728352b4da8e003eda9",
              "name": "Battery Change"
            }
          },
          {
            "task": {
              "id": "6744aca8d3346c216702c583",
              "name": "Discombobulate"
            }
          }
        ]
      },
      {
        "id": "6745cbee909d2013670a4a55",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Price_of_Independence",
        "name": "The Price of Independence",
        "trader": {
          "name": "BTR Driver"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6744a9dfef61d56e020b5c4a",
              "name": "Battery Change"
            }
          },
          {
            "task": {
              "id": "6744aca8d3346c216702c583",
              "name": "Discombobulate"
            }
          }
        ]
      },
      {
        "id": "67460662d0fbbc74ca0f7229",
        "minPlayerLevel": 20,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Choose_Your_Friends_Wisely",
        "name": "Choose Your Friends Wisely",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "674605df60a98cad1b0ec799",
              "name": "Killer Argument"
            }
          },
          {
            "task": {
              "id": "6744aca8d3346c216702c583",
              "name": "Discombobulate"
            }
          }
        ]
      },
      {
        "id": "5edab736cc183c769d778bc2",
        "minPlayerLevel": 21,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Colleagues_-_Part_1",
        "name": "Colleagues - Part 1",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "596a1e6c86f7741ddc2d3206",
              "name": "General Wares"
            }
          }
        ]
      },
      {
        "id": "5eda19f0edce541157209cee",
        "minPlayerLevel": 21,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Anesthesia",
        "name": "Anesthesia",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5967725e86f774601a446662",
              "name": "Shaking Up the Teller"
            }
          }
        ]
      },
      {
        "id": "59ca2eb686f77445a80ed049",
        "minPlayerLevel": 21,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Punisher_-_Part_6",
        "name": "The Punisher - Part 6",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca29fb86f77445ab465c87",
              "name": "The Punisher - Part 5"
            }
          }
        ]
      },
      {
        "id": "5edaba7c0c502106f869bc02",
        "minPlayerLevel": 21,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Colleagues_-_Part_2",
        "name": "Colleagues - Part 2",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5edab736cc183c769d778bc2",
              "name": "Colleagues - Part 1"
            }
          }
        ]
      },
      {
        "id": "5edabd13218d181e29451442",
        "minPlayerLevel": 21,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Rigged_Game",
        "name": "Rigged Game",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5eda19f0edce541157209cee",
              "name": "Anesthesia"
            }
          }
        ]
      },
      {
        "id": "64e7b99017ab941a6f7bf9d7",
        "minPlayerLevel": 21,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gendarmerie_-_Mall_Cop",
        "name": "Gendarmerie - Mall Cop",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca2eb686f77445a80ed049",
              "name": "The Punisher - Part 6"
            }
          }
        ]
      },
      {
        "id": "64e7b9a4aac4cd0a726562cb",
        "minPlayerLevel": 21,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gendarmerie_-_Tickets%2C_Please",
        "name": "Gendarmerie - Tickets, Please",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64e7b99017ab941a6f7bf9d7",
              "name": "Gendarmerie - Mall Cop"
            }
          }
        ]
      },
      {
        "id": "64e7b9bffd30422ed03dad38",
        "minPlayerLevel": 21,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gendarmerie_-_District_Patrol",
        "name": "Gendarmerie - District Patrol",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64e7b9a4aac4cd0a726562cb",
              "name": "Gendarmerie - Tickets, Please"
            }
          }
        ]
      },
      {
        "id": "5edac020218d181e29451446",
        "minPlayerLevel": 21,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Samples",
        "name": "Samples",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27b75b86f7742e97191958",
              "name": "Fishing Gear"
            }
          },
          {
            "task": {
              "id": "5eda19f0edce541157209cee",
              "name": "Anesthesia"
            }
          }
        ]
      },
      {
        "id": "6179ad0a6e9dd54ac275e3f2",
        "minPlayerLevel": 22,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Outcasts",
        "name": "The Huntsman Path - Outcasts",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          }
        ]
      },
      {
        "id": "5b478eca86f7744642012254",
        "minPlayerLevel": 22,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Vitamins_-_Part_1",
        "name": "Vitamins - Part 1",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "597a0e5786f77426d66c0636",
              "name": "Chemical - Part 3"
            }
          }
        ]
      },
      {
        "id": "64f5aac4b63b74469b6c14c2",
        "minPlayerLevel": 22,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Glory_to_CPSU_-_Part_2",
        "name": "Glory to CPSU - Part 2",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135b04ed9512be67647d7",
              "name": "Glory to CPSU - Part 1"
            }
          }
        ]
      },
      {
        "id": "639136f086e646067c176a8b",
        "minPlayerLevel": 22,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Kings_of_the_Rooftops",
        "name": "Kings of the Rooftops",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca264786f77445a80ed044",
              "name": "The Punisher - Part 4"
            }
          }
        ]
      },
      {
        "id": "639872fc93ae507d5858c3a6",
        "minPlayerLevel": 22,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_11",
        "name": "Gunsmith - Part 11",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae327c886f7745c7b3f2f3f",
              "name": "Gunsmith - Part 10"
            }
          }
        ]
      },
      {
        "id": "5b478ff486f7744d184ecbbf",
        "minPlayerLevel": 22,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Vitamins_-_Part_2",
        "name": "Vitamins - Part 2",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b478eca86f7744642012254",
              "name": "Vitamins - Part 1"
            }
          }
        ]
      },
      {
        "id": "5edac34d0bb72a50635c2bfa",
        "minPlayerLevel": 22,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Colleagues_-_Part_3",
        "name": "Colleagues - Part 3",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5edab4b1218d181e29451435",
              "name": "The Huntsman Path - Sadist"
            }
          }
        ]
      },
      {
        "id": "64f5e20652fc01298e2c61e3",
        "minPlayerLevel": 22,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Beyond_the_Red_Meat_-_Part_1",
        "name": "Beyond the Red Meat - Part 1",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b478ff486f7744d184ecbbf",
              "name": "Vitamins - Part 2"
            }
          }
        ]
      },
      {
        "id": "64f6aafd67e11a7c6206e0d0",
        "minPlayerLevel": 22,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Beyond_the_Red_Meat_-_Part_2",
        "name": "Beyond the Red Meat - Part 2",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64f5e20652fc01298e2c61e3",
              "name": "Beyond the Red Meat - Part 1"
            }
          }
        ]
      },
      {
        "id": "6573397ef3f8344c4575cd87",
        "minPlayerLevel": 22,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Properties_All_Around",
        "name": "Properties All Around",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64f5aac4b63b74469b6c14c2",
              "name": "Glory to CPSU - Part 2"
            }
          }
        ]
      },
      {
        "id": "5f04886a3937dc337a6b8238",
        "minPlayerLevel": 22,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Chemistry_Closet",
        "name": "Chemistry Closet",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5eda19f0edce541157209cee",
              "name": "Anesthesia"
            }
          },
          {
            "task": {
              "id": "5edab736cc183c769d778bc2",
              "name": "Colleagues - Part 1"
            }
          }
        ]
      },
      {
        "id": "5edab4b1218d181e29451435",
        "minPlayerLevel": 22,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Sadist",
        "name": "The Huntsman Path - Sadist",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5edabd13218d181e29451442",
              "name": "Rigged Game"
            }
          },
          {
            "task": {
              "id": "5edaba7c0c502106f869bc02",
              "name": "Colleagues - Part 2"
            }
          },
          {
            "task": {
              "id": "5f04886a3937dc337a6b8238",
              "name": "Chemistry Closet"
            }
          }
        ]
      },
      {
        "id": "639136df4b15ca31f76bc31f",
        "minPlayerLevel": 23,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Administrator",
        "name": "The Huntsman Path - Administrator",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          }
        ]
      },
      {
        "id": "5b47799d86f7746c5d6a5fd8",
        "minPlayerLevel": 23,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_12",
        "name": "Gunsmith - Part 12",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639872fc93ae507d5858c3a6",
              "name": "Gunsmith - Part 11"
            }
          }
        ]
      },
      {
        "id": "6578eb36e5020875d64645cd",
        "minPlayerLevel": 23,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Crooked_Cop",
        "name": "The Huntsman Path - Crooked Cop",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639136df4b15ca31f76bc31f",
              "name": "The Huntsman Path - Administrator"
            }
          }
        ]
      },
      {
        "id": "5edac63b930f5454f51e128b",
        "minPlayerLevel": 23,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/TerraGroup_Employee",
        "name": "TerraGroup Employee",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5edac020218d181e29451446",
              "name": "Samples"
            }
          },
          {
            "task": {
              "id": "5edac34d0bb72a50635c2bfa",
              "name": "Colleagues - Part 3"
            }
          }
        ]
      },
      {
        "id": "5b478d0f86f7744d190d91b5",
        "minPlayerLevel": 24,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Minibus",
        "name": "Minibus",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4493d86f7744b8e15aa8f",
              "name": "Database - Part 2"
            }
          }
        ]
      },
      {
        "id": "5b47926a86f7747ccc057c15",
        "minPlayerLevel": 24,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Informed_Means_Armed",
        "name": "Informed Means Armed",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c1234c286f77406fa13baeb",
              "name": "Setup"
            }
          }
        ]
      },
      {
        "id": "5b4795fb86f7745876267770",
        "minPlayerLevel": 24,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Chumming",
        "name": "Chumming",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b47926a86f7747ccc057c15",
              "name": "Informed Means Armed"
            }
          }
        ]
      },
      {
        "id": "658027799634223183395339",
        "minPlayerLevel": 24,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/No_Swiping",
        "name": "No Swiping",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b4795fb86f7745876267770",
              "name": "Chumming"
            }
          }
        ]
      },
      {
        "id": "6613f3007f6666d56807c929",
        "minPlayerLevel": 24,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Drip-Out_-_Part_1",
        "name": "Drip-Out - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b478d0f86f7744d190d91b5",
              "name": "Minibus"
            }
          }
        ]
      },
      {
        "id": "66151401efb0539ae10875ae",
        "minPlayerLevel": 24,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Drip-Out_-_Part_1",
        "name": "Drip-Out - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b478d0f86f7744d190d91b5",
              "name": "Minibus"
            }
          }
        ]
      },
      {
        "id": "675c3582f6ddc329a90f9c6d",
        "minPlayerLevel": 24,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Private_Club",
        "name": "Private Club",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b4795fb86f7745876267770",
              "name": "Chumming"
            }
          }
        ]
      },
      {
        "id": "66d9cbb67b491f9d5304f6e6",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Is_This_a_Reference%3F",
        "name": "Is This a Reference?",
        "trader": {
          "name": "Fence"
        }
      },
      {
        "id": "5b4794cb86f774598100d5d4",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Lend-Lease_-_Part_1",
        "name": "Lend-Lease - Part 1",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27d2af86f7744e1115b323",
              "name": "Friend From the West - Part 2"
            }
          }
        ]
      },
      {
        "id": "5d4bec3486f7743cac246665",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Regulated_Materials",
        "name": "Regulated Materials",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5979f8bb86f7743ec214c7a6",
              "name": "Polikhim Hobo"
            }
          }
        ]
      },
      {
        "id": "5c0bd01e86f7747cdd799e56",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Insomnia",
        "name": "Insomnia",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "61958c366726521dd96828ec",
              "name": "Cargo X - Part 4"
            }
          }
        ]
      },
      {
        "id": "6179b3a12153c15e937d52bc",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Energy_Crisis",
        "name": "Energy Crisis",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3464c86f7741d651d6877",
              "name": "Farming - Part 4"
            }
          }
        ]
      },
      {
        "id": "5ae4495086f77443c122bc40",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sew_it_Good_-_Part_1",
        "name": "Sew it Good - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4493d86f7744b8e15aa8f",
              "name": "Database - Part 2"
            }
          }
        ]
      },
      {
        "id": "5d25e46e86f77409453bce7c",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Ambulance",
        "name": "Ambulance",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e48d86f77408251c4bfb",
              "name": "Shady Business"
            }
          }
        ]
      },
      {
        "id": "5ac244c486f77413e12cf945",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_13",
        "name": "Gunsmith - Part 13",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b47799d86f7746c5d6a5fd8",
              "name": "Gunsmith - Part 12"
            }
          }
        ]
      },
      {
        "id": "5c0bbaa886f7746941031d82",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Bullshit",
        "name": "Bullshit",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b4795fb86f7745876267770",
              "name": "Chumming"
            }
          }
        ]
      },
      {
        "id": "5ae4495c86f7744e87761355",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sew_it_Good_-_Part_2",
        "name": "Sew it Good - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4495086f77443c122bc40",
              "name": "Sew it Good - Part 1"
            }
          }
        ]
      },
      {
        "id": "5ae4496986f774459e77beb6",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sew_it_Good_-_Part_3",
        "name": "Sew it Good - Part 3",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4495c86f7744e87761355",
              "name": "Sew it Good - Part 2"
            }
          }
        ]
      },
      {
        "id": "5ae4497b86f7744cf402ed00",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sew_it_Good_-_Part_4",
        "name": "Sew it Good - Part 4",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4496986f774459e77beb6",
              "name": "Sew it Good - Part 3"
            }
          }
        ]
      },
      {
        "id": "65733403eefc2c312a759ddb",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Developer's_Secrets_-_Part_1",
        "name": "Developer's Secrets - Part 1",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135e8c115f907b14700aa",
              "name": "Surveillance"
            }
          }
        ]
      },
      {
        "id": "6573382e557ff128bf3da536",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Developer's_Secrets_-_Part_2",
        "name": "Developer's Secrets - Part 2",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "65733403eefc2c312a759ddb",
              "name": "Developer's Secrets - Part 1"
            }
          }
        ]
      },
      {
        "id": "63a9b229813bba58a50c9ee5",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Worst_Job_in_the_World",
        "name": "Worst Job in the World",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bc6986f7741c7358402b",
              "name": "Wet Job - Part 5"
            }
          },
          {
            "task": {
              "id": "639135f286e646067c176a87",
              "name": "Revision - Streets of Tarkov"
            }
          }
        ]
      },
      {
        "id": "639135e8c115f907b14700aa",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Surveillance",
        "name": "Surveillance",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63913715f8e5dd32bf4e3aaa",
              "name": "Broadcast - Part 2"
            }
          },
          {
            "task": {
              "id": "6179b3bdc7560e13d23eeb8d",
              "name": "Corporate Secrets"
            }
          }
        ]
      },
      {
        "id": "5ae4499a86f77449783815db",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Charisma_Brings_Success",
        "name": "Charisma Brings Success",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448f286f77448d73c0131",
              "name": "The Blood of War - Part 1"
            }
          },
          {
            "task": {
              "id": "5ae4497b86f7744cf402ed00",
              "name": "Sew it Good - Part 4"
            }
          }
        ]
      },
      {
        "id": "5b47876e86f7744d1c353205",
        "minPlayerLevel": 25,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Blood_of_War_-_Part_2",
        "name": "The Blood of War - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448f286f77448d73c0131",
              "name": "The Blood of War - Part 1"
            }
          },
          {
            "task": {
              "id": "5ae4495086f77443c122bc40",
              "name": "Sew it Good - Part 1"
            }
          }
        ]
      },
      {
        "id": "63a9ae24009ffc6a551631a5",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Best_Job_in_the_World",
        "name": "Best Job in the World",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca2eb686f77445a80ed049",
              "name": "The Punisher - Part 6"
            }
          },
          {
            "task": {
              "id": "639136f086e646067c176a8b",
              "name": "Kings of the Rooftops"
            }
          }
        ]
      },
      {
        "id": "639135bbc115f907b14700a6",
        "minPlayerLevel": 25,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Audiophile",
        "name": "Audiophile",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135a7e705511c8a4a1b78",
              "name": "Ballet Lover"
            }
          },
          {
            "task": {
              "id": "5b478d0f86f7744d190d91b5",
              "name": "Minibus"
            }
          }
        ]
      },
      {
        "id": "6179afd0bca27a099552e040",
        "minPlayerLevel": 26,
        "kappaRequired": true,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Lost_Contact",
        "name": "Lost Contact",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68663e86f774501078f78a",
              "name": "Health Care Privacy - Part 2"
            }
          }
        ]
      },
      {
        "id": "5ae4498786f7744bde357695",
        "minPlayerLevel": 26,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Key_to_Success",
        "name": "The Key to Success",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4495c86f7744e87761355",
              "name": "Sew it Good - Part 2"
            }
          }
        ]
      },
      {
        "id": "5ae449a586f7744bde357696",
        "minPlayerLevel": 26,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/No_Fuss_Needed",
        "name": "No Fuss Needed",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4498786f7744bde357695",
              "name": "The Key to Success"
            }
          }
        ]
      },
      {
        "id": "626bd75b05f287031503c7f6",
        "minPlayerLevel": 26,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Drug_Trafficking",
        "name": "Drug Trafficking",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6179afd0bca27a099552e040",
              "name": "Lost Contact"
            }
          }
        ]
      },
      {
        "id": "666314b4d7f171c4c20226c3",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Good_Times_-_Part_1",
        "name": "The Good Times - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "657315df034d76585f032e01",
              "name": "Shooting Cans"
            }
          }
        ]
      },
      {
        "id": "6391372c8ba6894d155e77d7",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Broadcast_-_Part_4",
        "name": "Broadcast - Part 4",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63a511ea30d85e10e375b045",
              "name": "Broadcast - Part 3"
            }
          }
        ]
      },
      {
        "id": "639872fe8871e1272b10ccf6",
        "minPlayerLevel": 27,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_14",
        "name": "Gunsmith - Part 14",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac244c486f77413e12cf945",
              "name": "Gunsmith - Part 13"
            }
          }
        ]
      },
      {
        "id": "64ee99639878a0569d6ec8c9",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Broadcast_-_Part_5",
        "name": "Broadcast - Part 5",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6391372c8ba6894d155e77d7",
              "name": "Broadcast - Part 4"
            }
          }
        ]
      },
      {
        "id": "666314b0acf8442f8b0531a1",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hell_on_Earth_-_Part_1",
        "name": "Hell on Earth - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314b4d7f171c4c20226c3",
              "name": "The Good Times - Part 1"
            }
          }
        ]
      },
      {
        "id": "666314b2a9290f9e0806cca3",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hell_on_Earth_-_Part_2",
        "name": "Hell on Earth - Part 2",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314b0acf8442f8b0531a1",
              "name": "Hell on Earth - Part 1"
            }
          }
        ]
      },
      {
        "id": "666314b696a9349baa021bac",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Quality_Standard",
        "name": "Quality Standard",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314b4d7f171c4c20226c3",
              "name": "The Good Times - Part 1"
            }
          }
        ]
      },
      {
        "id": "666314b8312343839d032d24",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Airmail",
        "name": "Airmail",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314b696a9349baa021bac",
              "name": "Quality Standard"
            }
          }
        ]
      },
      {
        "id": "666314bafd5ca9577902e03a",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Good_Times_-_Part_2",
        "name": "The Good Times - Part 2",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314b8312343839d032d24",
              "name": "Airmail"
            }
          }
        ]
      },
      {
        "id": "666314bc1d3ec95634095e77",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Minute_of_Fame",
        "name": "Minute of Fame",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314bafd5ca9577902e03a",
              "name": "The Good Times - Part 2"
            }
          }
        ]
      },
      {
        "id": "666314bd920800278d0f6748",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Viewer",
        "name": "Viewer",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314bc1d3ec95634095e77",
              "name": "Minute of Fame"
            }
          }
        ]
      },
      {
        "id": "666314bf1cd52e3d040a2e78",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Serious_Allegations",
        "name": "Serious Allegations",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314bd920800278d0f6748",
              "name": "Viewer"
            }
          }
        ]
      },
      {
        "id": "666314c10aa5c7436c00908c",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Camera%2C_Action!",
        "name": "Camera, Action!",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314bf1cd52e3d040a2e78",
              "name": "Serious Allegations"
            }
          }
        ]
      },
      {
        "id": "666314c3acf8442f8b0531a3",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Proper_Comeback",
        "name": "Proper Comeback",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314c10aa5c7436c00908c",
              "name": "Camera, Action!"
            }
          }
        ]
      },
      {
        "id": "666314c5a9290f9e0806cca5",
        "minPlayerLevel": 27,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Key_to_the_City",
        "name": "Key to the City",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314c3acf8442f8b0531a3",
              "name": "Proper Comeback"
            }
          }
        ]
      },
      {
        "id": "5b47891f86f7744d1b23c571",
        "minPlayerLevel": 27,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Living_High_is_Not_a_Crime_-_Part_1",
        "name": "Living High is Not a Crime - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448f286f77448d73c0131",
              "name": "The Blood of War - Part 1"
            }
          },
          {
            "task": {
              "id": "5ae4496986f774459e77beb6",
              "name": "Sew it Good - Part 3"
            }
          }
        ]
      },
      {
        "id": "5d25e4ad86f77443e625e387",
        "minPlayerLevel": 28,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Nostalgia",
        "name": "Nostalgia",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e48186f77443e625e386",
              "name": "Courtesy Visit"
            }
          }
        ]
      },
      {
        "id": "6572e876dc0d635f633a5714",
        "minPlayerLevel": 28,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Pyramid_Scheme",
        "name": "Pyramid Scheme",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b478ff486f7744d184ecbbf",
              "name": "Vitamins - Part 2"
            }
          }
        ]
      },
      {
        "id": "5d25e4b786f77408251c4bfc",
        "minPlayerLevel": 28,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Fishing_Place",
        "name": "Fishing Place",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e4ad86f77443e625e387",
              "name": "Nostalgia"
            }
          }
        ]
      },
      {
        "id": "66ab9da7eb102b9bcd08591c",
        "minPlayerLevel": 28,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Forester's_Duty",
        "name": "Forester's Duty",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e4ad86f77443e625e387",
              "name": "Nostalgia"
            }
          }
        ]
      },
      {
        "id": "5b478b1886f7744d1b23c57d",
        "minPlayerLevel": 29,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hot_Delivery",
        "name": "Hot Delivery",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae449b386f77446d8741719",
              "name": "Gratitude"
            }
          }
        ]
      },
      {
        "id": "5ae3280386f7742a41359364",
        "minPlayerLevel": 29,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_15",
        "name": "Gunsmith - Part 15",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639872fe8871e1272b10ccf6",
              "name": "Gunsmith - Part 14"
            }
          }
        ]
      },
      {
        "id": "5c112d7e86f7740d6f647486",
        "minPlayerLevel": 29,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Scavenger",
        "name": "Scavenger",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b478b1886f7744d1b23c57d",
              "name": "Hot Delivery"
            }
          }
        ]
      },
      {
        "id": "6179b5eabca27a099552e052",
        "minPlayerLevel": 30,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Counteraction",
        "name": "Counteraction",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a0327ba86f77456b9154236",
              "name": "Spa Tour - Part 3"
            }
          }
        ]
      },
      {
        "id": "5c1128e386f7746565181106",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Fertilizers",
        "name": "Fertilizers",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3464c86f7741d651d6877",
              "name": "Farming - Part 4"
            }
          }
        ]
      },
      {
        "id": "5ae449c386f7744bde357697",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Sales_Night",
        "name": "Sales Night",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae449b386f77446d8741719",
              "name": "Gratitude"
            }
          }
        ]
      },
      {
        "id": "5c0bd94186f7747a727f09b2",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Test_Drive_-_Part_1",
        "name": "Test Drive - Part 1",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0d190cd09282029f5390d8",
              "name": "Grenadier"
            }
          }
        ]
      },
      {
        "id": "5c0d0d5086f774363760aef2",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Athlete",
        "name": "Athlete",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68667486f7742607157d28",
              "name": "Health Care Privacy - Part 4"
            }
          }
        ]
      },
      {
        "id": "6179b4f16e9dd54ac275e407",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Missing_Cargo",
        "name": "Missing Cargo",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6193850f60b34236ee0483de",
              "name": "Long Road"
            }
          }
        ]
      },
      {
        "id": "6179b5b06e9dd54ac275e409",
        "minPlayerLevel": 30,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Our_Own_Land",
        "name": "Our Own Land",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca29fb86f77445ab465c87",
              "name": "The Punisher - Part 5"
            }
          }
        ]
      },
      {
        "id": "5d25e45e86f77408251c4bfa",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Eraser_-_Part_2",
        "name": "The Huntsman Path - Eraser - Part 2",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2b486f77409de05bba0",
              "name": "The Huntsman Path - Secured Perimeter"
            }
          },
          {
            "task": {
              "id": "5d25e44f86f77443e625e385",
              "name": "The Huntsman Path - Eraser - Part 1"
            }
          }
        ]
      },
      {
        "id": "5c0bc91486f7746ab41857a2",
        "minPlayerLevel": 30,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Silent_Caliber",
        "name": "Silent Caliber",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0bbaa886f7746941031d82",
              "name": "Bullshit"
            }
          }
        ]
      },
      {
        "id": "5c0d0f1886f77457b8210226",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Lend-Lease_-_Part_2",
        "name": "Lend-Lease - Part 2",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b4794cb86f774598100d5d4",
              "name": "Lend-Lease - Part 1"
            }
          }
        ]
      },
      {
        "id": "5c10f94386f774227172c572",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Blood_of_War_-_Part_3",
        "name": "The Blood of War - Part 3",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b47876e86f7744d1c353205",
              "name": "The Blood of War - Part 2"
            }
          }
        ]
      },
      {
        "id": "5ac242ab86f77412464f68b4",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_16",
        "name": "Gunsmith - Part 16",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae3280386f7742a41359364",
              "name": "Gunsmith - Part 15"
            }
          }
        ]
      },
      {
        "id": "5c0d4c12d09282029f539173",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Peacekeeping_Mission",
        "name": "Peacekeeping Mission",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0d0f1886f77457b8210226",
              "name": "Lend-Lease - Part 2"
            }
          }
        ]
      },
      {
        "id": "63a5cf262964a7488f5243ce",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Test_Drive_-_Part_2",
        "name": "Test Drive - Part 2",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0bd94186f7747a727f09b2",
              "name": "Test Drive - Part 1"
            }
          }
        ]
      },
      {
        "id": "64f5deac39e45b527a7c4232",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Test_Drive_-_Part_3",
        "name": "Test Drive - Part 3",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63a5cf262964a7488f5243ce",
              "name": "Test Drive - Part 2"
            }
          }
        ]
      },
      {
        "id": "66aa61663aa37705c5024277",
        "minPlayerLevel": 30,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Know_Your_Place!",
        "name": "Know Your Place!",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c10f94386f774227172c572",
              "name": "The Blood of War - Part 3"
            }
          }
        ]
      },
      {
        "id": "5d25e2e286f77444001e2e48",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Sellout",
        "name": "The Huntsman Path - Sellout",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          },
          {
            "task": {
              "id": "5ae449c386f7744bde357697",
              "name": "Sales Night"
            }
          }
        ]
      },
      {
        "id": "5c1141f386f77430ff393792",
        "minPlayerLevel": 30,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Living_High_is_Not_a_Crime_-_Part_2",
        "name": "Living High is Not a Crime - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b47891f86f7744d1b23c571",
              "name": "Living High is Not a Crime - Part 1"
            }
          },
          {
            "task": {
              "id": "5c10f94386f774227172c572",
              "name": "The Blood of War - Part 3"
            }
          }
        ]
      },
      {
        "id": "639dbaf17c898a131e1cffff",
        "minPlayerLevel": 31,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Debtor",
        "name": "Debtor",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b4795fb86f7745876267770",
              "name": "Chumming"
            }
          }
        ]
      },
      {
        "id": "5b47749f86f7746c5d6a5fd4",
        "minPlayerLevel": 31,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_17",
        "name": "Gunsmith - Part 17",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac242ab86f77412464f68b4",
              "name": "Gunsmith - Part 16"
            }
          }
        ]
      },
      {
        "id": "5d25e4ca86f77409dd5cdf2c",
        "minPlayerLevel": 33,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hunting_Trip",
        "name": "Hunting Trip",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2ee86f77443e35162ea",
              "name": "The Huntsman Path - Woods Keeper"
            }
          }
        ]
      },
      {
        "id": "600302d73b897b11364cd161",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Hunter",
        "name": "Hunter",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2ee86f77443e35162ea",
              "name": "The Huntsman Path - Woods Keeper"
            }
          }
        ]
      },
      {
        "id": "65734c186dc1e402c80dc19e",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Dandies",
        "name": "Dandies",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135a7e705511c8a4a1b78",
              "name": "Ballet Lover"
            }
          }
        ]
      },
      {
        "id": "67b45467814ab0ffa000c7e7",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Art_of_Explosion",
        "name": "The Art of Explosion",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0d190cd09282029f5390d8",
              "name": "Grenadier"
            }
          }
        ]
      },
      {
        "id": "5b477b6f86f7747290681823",
        "minPlayerLevel": 33,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_18",
        "name": "Gunsmith - Part 18",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b47749f86f7746c5d6a5fd4",
              "name": "Gunsmith - Part 17"
            }
          }
        ]
      },
      {
        "id": "639135c3744e452011470807",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/House_Arrest_-_Part_1",
        "name": "House Arrest - Part 1",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639dbaf17c898a131e1cffff",
              "name": "Debtor"
            }
          }
        ]
      },
      {
        "id": "625d6ffaf7308432be1d44c5",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Network_Provider_-_Part_2",
        "name": "Network Provider - Part 2",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d6ff5ddc94657c21a1625",
              "name": "Network Provider - Part 1"
            }
          }
        ]
      },
      {
        "id": "625d6ffcaa168e51321d69d7",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Assessment_-_Part_1",
        "name": "Assessment - Part 1",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d6ffaf7308432be1d44c5",
              "name": "Network Provider - Part 2"
            }
          }
        ]
      },
      {
        "id": "625d6fff4149f1149b5b12c9",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Assessment_-_Part_2",
        "name": "Assessment - Part 2",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d6ffcaa168e51321d69d7",
              "name": "Assessment - Part 1"
            }
          }
        ]
      },
      {
        "id": "625d7001c4874104f230c0c5",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Assessment_-_Part_3",
        "name": "Assessment - Part 3",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d6fff4149f1149b5b12c9",
              "name": "Assessment - Part 2"
            }
          }
        ]
      },
      {
        "id": "625d70031ed3bb5bcc5bd9e5",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Key_to_the_Tower",
        "name": "Key to the Tower",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d7001c4874104f230c0c5",
              "name": "Assessment - Part 3"
            }
          }
        ]
      },
      {
        "id": "625d7005a4eb80027c4f2e09",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Knock-Knock",
        "name": "Knock-Knock",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d70031ed3bb5bcc5bd9e5",
              "name": "Key to the Tower"
            }
          }
        ]
      },
      {
        "id": "625d700cc48e6c62a440fab5",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Getting_Acquainted",
        "name": "Getting Acquainted",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d7005a4eb80027c4f2e09",
              "name": "Knock-Knock"
            }
          }
        ]
      },
      {
        "id": "626148251ed3bb5bcc5bd9ed",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends_-_Buyout",
        "name": "Make Amends - Buyout",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d700cc48e6c62a440fab5",
              "name": "Getting Acquainted"
            }
          }
        ]
      },
      {
        "id": "6261482fa4eb80027c4f2e11",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends_-_Equipment",
        "name": "Make Amends - Equipment",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "626148251ed3bb5bcc5bd9ed",
              "name": "Make Amends - Buyout"
            }
          }
        ]
      },
      {
        "id": "639135cd8ba6894d155e77cb",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/House_Arrest_-_Part_2",
        "name": "House Arrest - Part 2",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639135c3744e452011470807",
              "name": "House Arrest - Part 1"
            }
          }
        ]
      },
      {
        "id": "6391d90f4ed9512be67647df",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends",
        "name": "Make Amends",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6261482fa4eb80027c4f2e11",
              "name": "Make Amends - Equipment"
            }
          }
        ]
      },
      {
        "id": "63966faeea19ac7ed845db2c",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Information_Source",
        "name": "Information Source",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "625d7005a4eb80027c4f2e09",
              "name": "Knock-Knock"
            }
          }
        ]
      },
      {
        "id": "63966fbeea19ac7ed845db2e",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Missing_Informant",
        "name": "Missing Informant",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63966faeea19ac7ed845db2c",
              "name": "Information Source"
            }
          }
        ]
      },
      {
        "id": "63966fccac6f8f3c677b9d89",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Snatch",
        "name": "Snatch",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63966fbeea19ac7ed845db2e",
              "name": "Missing Informant"
            }
          }
        ]
      },
      {
        "id": "63966fd9ea19ac7ed845db30",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Payback",
        "name": "Payback",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63966fe7ea74a47c2d3fc0e6",
              "name": "Return the Favor"
            }
          }
        ]
      },
      {
        "id": "63966fe7ea74a47c2d3fc0e6",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Return_the_Favor",
        "name": "Return the Favor",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63966fccac6f8f3c677b9d89",
              "name": "Snatch"
            }
          }
        ]
      },
      {
        "id": "63966ff54c3ef01b6f3ffad8",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Provocation",
        "name": "Provocation",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63966fd9ea19ac7ed845db30",
              "name": "Payback"
            }
          }
        ]
      },
      {
        "id": "639670029113f06a7c3b2377",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Following_the_Bread_Crumbs",
        "name": "Following the Bread Crumbs",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63966ff54c3ef01b6f3ffad8",
              "name": "Provocation"
            }
          }
        ]
      },
      {
        "id": "6396700fea19ac7ed845db32",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Spotter",
        "name": "Spotter",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639670029113f06a7c3b2377",
              "name": "Following the Bread Crumbs"
            }
          }
        ]
      },
      {
        "id": "6396701b9113f06a7c3b2379",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_an_Impression",
        "name": "Make an Impression",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6396700fea19ac7ed845db32",
              "name": "Spotter"
            }
          }
        ]
      },
      {
        "id": "63967028c4a91c5cb76abd81",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Trouble_in_the_Big_City",
        "name": "Trouble in the Big City",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6396701b9113f06a7c3b2379",
              "name": "Make an Impression"
            }
          }
        ]
      },
      {
        "id": "6613f307fca4f2f386029409",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Drip-Out_-_Part_2",
        "name": "Drip-Out - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "65734c186dc1e402c80dc19e",
              "name": "Dandies"
            }
          }
        ]
      },
      {
        "id": "6615141bfda04449120269a7",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Drip-Out_-_Part_2",
        "name": "Drip-Out - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "65734c186dc1e402c80dc19e",
              "name": "Dandies"
            }
          }
        ]
      },
      {
        "id": "626148334149f1149b5b12ca",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends_-_Security",
        "name": "Make Amends - Security",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6391d90f4ed9512be67647df",
              "name": "Make Amends"
            }
          }
        ]
      },
      {
        "id": "62614836f7308432be1d44cc",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends_-_Sweep_Up",
        "name": "Make Amends - Sweep Up",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "626148334149f1149b5b12ca",
              "name": "Make Amends - Security"
            }
          }
        ]
      },
      {
        "id": "6391d912f8e5dd32bf4e3ab2",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends",
        "name": "Make Amends",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "62614836f7308432be1d44cc",
              "name": "Make Amends - Sweep Up"
            }
          }
        ]
      },
      {
        "id": "6261483ac48e6c62a440fab7",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends_-_Software",
        "name": "Make Amends - Software",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6391d912f8e5dd32bf4e3ab2",
              "name": "Make Amends"
            }
          }
        ]
      },
      {
        "id": "6261483dc4874104f230c0cd",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends_-_Quarantine",
        "name": "Make Amends - Quarantine",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6261483ac48e6c62a440fab7",
              "name": "Make Amends - Software"
            }
          }
        ]
      },
      {
        "id": "6391d9144b15ca31f76bc323",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Make_Amends",
        "name": "Make Amends",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6261483dc4874104f230c0cd",
              "name": "Make Amends - Quarantine"
            }
          }
        ]
      },
      {
        "id": "626bd75d5bef5d7d590bd415",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Top_Secret",
        "name": "Top Secret",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6179b4f16e9dd54ac275e407",
              "name": "Missing Cargo"
            }
          },
          {
            "task": {
              "id": "625d700cc48e6c62a440fab5",
              "name": "Getting Acquainted"
            }
          }
        ]
      },
      {
        "id": "6764174c86addd02bc033d68",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Connections_Up_North",
        "name": "Connections Up North",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0bc91486f7746ab41857a2",
              "name": "Silent Caliber"
            }
          },
          {
            "task": {
              "id": "5d25e4ca86f77409dd5cdf2c",
              "name": "Hunting Trip"
            }
          }
        ]
      },
      {
        "id": "625d6ff5ddc94657c21a1625",
        "minPlayerLevel": 33,
        "kappaRequired": false,
        "lightkeeperRequired": true,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Network_Provider_-_Part_1",
        "name": "Network Provider - Part 1",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          },
          {
            "task": {
              "id": "597a0f5686f774273b74f676",
              "name": "Chemical - Part 4"
            }
          },
          {
            "task": {
              "id": "61958c366726521dd96828ec",
              "name": "Cargo X - Part 4"
            }
          },
          {
            "task": {
              "id": "63913715f8e5dd32bf4e3aaa",
              "name": "Broadcast - Part 2"
            }
          },
          {
            "task": {
              "id": "608974d01a66564e74191fc0",
              "name": "A Fuel Matter"
            }
          },
          {
            "task": {
              "id": "5ae4493d86f7744b8e15aa8f",
              "name": "Database - Part 2"
            }
          },
          {
            "task": {
              "id": "6179ad56c760af5ad2053587",
              "name": "Seaside Vacation"
            }
          },
          {
            "task": {
              "id": "5a27ba1c86f77461ea5a3c56",
              "name": "The Cult - Part 2"
            }
          },
          {
            "task": {
              "id": "59ca264786f77445a80ed044",
              "name": "The Punisher - Part 4"
            }
          },
          {
            "task": {
              "id": "5d25e48186f77443e625e386",
              "name": "Courtesy Visit"
            }
          },
          {
            "task": {
              "id": "5ae327c886f7745c7b3f2f3f",
              "name": "Gunsmith - Part 10"
            }
          },
          {
            "task": {
              "id": "6179afd0bca27a099552e040",
              "name": "Lost Contact"
            }
          },
          {
            "task": {
              "id": "639135c3744e452011470807",
              "name": "House Arrest - Part 1"
            }
          }
        ]
      },
      {
        "id": "67e993b1ac26bf29380a320b",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Surprise_Gift",
        "name": "Surprise Gift",
        "trader": {
          "name": "Lightkeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66058ccf06ef1d50a60c1f48",
              "name": "Between Two Fires"
            }
          }
        ]
      },
      {
        "id": "639135534b15ca31f76bc317",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Your_Car_Needs_a_Service",
        "name": "Your Car Needs a Service",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "61958c366726521dd96828ec",
              "name": "Cargo X - Part 4"
            }
          }
        ]
      },
      {
        "id": "5c0be13186f7746f016734aa",
        "minPlayerLevel": 35,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Psycho_Sniper",
        "name": "Psycho Sniper",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bc8586f7741b543d8ea4",
              "name": "Wet Job - Part 6"
            }
          }
        ]
      },
      {
        "id": "5c139eb686f7747878361a6f",
        "minPlayerLevel": 35,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Import",
        "name": "Import",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ac3464c86f7741d651d6877",
              "name": "Farming - Part 4"
            }
          }
        ]
      },
      {
        "id": "5c12452c86f7744b83469073",
        "minPlayerLevel": 35,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Perfect_Mediator",
        "name": "Perfect Mediator",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5967725e86f774601a446662",
              "name": "Shaking Up the Teller"
            }
          }
        ]
      },
      {
        "id": "6663149cfd5ca9577902e037",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Invisible_Hand",
        "name": "The Invisible Hand",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae448a386f7744d3730fff0",
              "name": "Only Business"
            }
          }
        ]
      },
      {
        "id": "5c0be5fc86f774467a116593",
        "minPlayerLevel": 35,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Private_Clinic",
        "name": "Private Clinic",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68667486f7742607157d28",
              "name": "Health Care Privacy - Part 4"
            }
          }
        ]
      },
      {
        "id": "5c0bdb5286f774166e38eed4",
        "minPlayerLevel": 35,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Flint",
        "name": "Flint",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b4795fb86f7745876267770",
              "name": "Chumming"
            }
          }
        ]
      },
      {
        "id": "6663149f1d3ec95634095e75",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Circulate",
        "name": "Circulate",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6663149cfd5ca9577902e037",
              "name": "The Invisible Hand"
            }
          }
        ]
      },
      {
        "id": "666314a1920800278d0f6746",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Special_Offer",
        "name": "Special Offer",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6663149f1d3ec95634095e75",
              "name": "Circulate"
            }
          }
        ]
      },
      {
        "id": "666314a31cd52e3d040a2e76",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Combat_Proven",
        "name": "Combat Proven",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314a1920800278d0f6746",
              "name": "Special Offer"
            }
          }
        ]
      },
      {
        "id": "666314a50aa5c7436c00908a",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Old_Patterns",
        "name": "Old Patterns",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "666314a31cd52e3d040a2e76",
              "name": "Combat Proven"
            }
          }
        ]
      },
      {
        "id": "671a49f77d49aea42c029b5f",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Irresistible",
        "name": "Irresistible",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0bdb5286f774166e38eed4",
              "name": "Flint"
            }
          }
        ]
      },
      {
        "id": "671a59e43d73dac1360765cc",
        "minPlayerLevel": 35,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Dangerous_Props",
        "name": "Dangerous Props",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "671a49f77d49aea42c029b5f",
              "name": "Irresistible"
            }
          }
        ]
      },
      {
        "id": "626bdcc3a371ee3a7a3514c5",
        "minPlayerLevel": 35,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Stray_Dogs",
        "name": "Stray Dogs",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2c386f77443e7549029",
              "name": "The Huntsman Path - Trophy"
            }
          },
          {
            "task": {
              "id": "5d25e2ee86f77443e35162ea",
              "name": "The Huntsman Path - Woods Keeper"
            }
          },
          {
            "task": {
              "id": "5d25e2e286f77444001e2e48",
              "name": "The Huntsman Path - Sellout"
            }
          }
        ]
      },
      {
        "id": "5c0d1c4cd0928202a02a6f5c",
        "minPlayerLevel": 35,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Decontamination_Service",
        "name": "Decontamination Service",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a68669a86f774255929b4d4",
              "name": "Health Care Privacy - Part 5"
            }
          },
          {
            "task": {
              "id": "5c0be5fc86f774467a116593",
              "name": "Private Clinic"
            }
          }
        ]
      },
      {
        "id": "639873003693c63d86328f25",
        "minPlayerLevel": 36,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_19",
        "name": "Gunsmith - Part 19",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b477b6f86f7747290681823",
              "name": "Gunsmith - Part 18"
            }
          }
        ]
      },
      {
        "id": "5b477f7686f7744d1b23c4d2",
        "minPlayerLevel": 37,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_20",
        "name": "Gunsmith - Part 20",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639873003693c63d86328f25",
              "name": "Gunsmith - Part 19"
            }
          }
        ]
      },
      {
        "id": "63987301e11ec11ff5504036",
        "minPlayerLevel": 38,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_21",
        "name": "Gunsmith - Part 21",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b477f7686f7744d1b23c4d2",
              "name": "Gunsmith - Part 20"
            }
          }
        ]
      },
      {
        "id": "5b47825886f77468074618d3",
        "minPlayerLevel": 39,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_22",
        "name": "Gunsmith - Part 22",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "63987301e11ec11ff5504036",
              "name": "Gunsmith - Part 21"
            }
          }
        ]
      },
      {
        "id": "64f83bb69878a0569d6ecfbe",
        "minPlayerLevel": 39,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_23",
        "name": "Gunsmith - Part 23",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5b47825886f77468074618d3",
              "name": "Gunsmith - Part 22"
            }
          }
        ]
      },
      {
        "id": "64f83bcdde58fc437700d8fa",
        "minPlayerLevel": 39,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_24",
        "name": "Gunsmith - Part 24",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64f83bb69878a0569d6ecfbe",
              "name": "Gunsmith - Part 23"
            }
          }
        ]
      },
      {
        "id": "64f83bd983cfca080a362c82",
        "minPlayerLevel": 39,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Gunsmith_-_Part_25",
        "name": "Gunsmith - Part 25",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64f83bcdde58fc437700d8fa",
              "name": "Gunsmith - Part 24"
            }
          }
        ]
      },
      {
        "id": "5c0d4e61d09282029f53920e",
        "minPlayerLevel": 40,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Guide",
        "name": "The Guide",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5a27bc8586f7741b543d8ea4",
              "name": "Wet Job - Part 6"
            }
          }
        ]
      },
      {
        "id": "6574e0dedc0d635f633a5805",
        "minPlayerLevel": 40,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Test_Drive_-_Part_4",
        "name": "Test Drive - Part 4",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "64f5deac39e45b527a7c4232",
              "name": "Test Drive - Part 3"
            }
          }
        ]
      },
      {
        "id": "669fa3a40c828825de06d6a1",
        "minPlayerLevel": 40,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Test_Drive_-_Part_5",
        "name": "Test Drive - Part 5",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6574e0dedc0d635f633a5805",
              "name": "Test Drive - Part 4"
            }
          }
        ]
      },
      {
        "id": "675c1ff1a757ddd00404f0aa",
        "minPlayerLevel": 40,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Test_Drive_-_Part_6",
        "name": "Test Drive - Part 6",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "669fa3a40c828825de06d6a1",
              "name": "Test Drive - Part 5"
            }
          }
        ]
      },
      {
        "id": "63a9b36cc31b00242d28a99f",
        "minPlayerLevel": 40,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Slaughterhouse",
        "name": "Slaughterhouse",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "639136df4b15ca31f76bc31f",
              "name": "The Huntsman Path - Administrator"
            }
          },
          {
            "task": {
              "id": "6391372c8ba6894d155e77d7",
              "name": "Broadcast - Part 4"
            }
          }
        ]
      },
      {
        "id": "5ae449d986f774453a54a7e1",
        "minPlayerLevel": 40,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Supervisor",
        "name": "Supervisor",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4498786f7744bde357695",
              "name": "The Key to Success"
            }
          },
          {
            "task": {
              "id": "5ae449c386f7744bde357697",
              "name": "Sales Night"
            }
          }
        ]
      },
      {
        "id": "60e71b9bbd90872cb85440f3",
        "minPlayerLevel": 42,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Capturing_Outposts",
        "name": "Capturing Outposts",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca2eb686f77445a80ed049",
              "name": "The Punisher - Part 6"
            }
          }
        ]
      },
      {
        "id": "5e381b0286f77420e3417a74",
        "minPlayerLevel": 42,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Textile_-_Part_1",
        "name": "Textile - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4497b86f7744cf402ed00",
              "name": "Sew it Good - Part 4"
            }
          }
        ]
      },
      {
        "id": "5e383a6386f77465910ce1f3",
        "minPlayerLevel": 42,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Textile_-_Part_1",
        "name": "Textile - Part 1",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae4497b86f7744cf402ed00",
              "name": "Sew it Good - Part 4"
            }
          }
        ]
      },
      {
        "id": "5e4d4ac186f774264f758336",
        "minPlayerLevel": 42,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Textile_-_Part_2",
        "name": "Textile - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5e381b0286f77420e3417a74",
              "name": "Textile - Part 1"
            }
          }
        ]
      },
      {
        "id": "5e4d515e86f77438b2195244",
        "minPlayerLevel": 42,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Textile_-_Part_2",
        "name": "Textile - Part 2",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5e383a6386f77465910ce1f3",
              "name": "Textile - Part 1"
            }
          }
        ]
      },
      {
        "id": "60e71bb4e456d449cd47ca75",
        "minPlayerLevel": 45,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Intimidator",
        "name": "Intimidator",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca2eb686f77445a80ed049",
              "name": "The Punisher - Part 6"
            }
          }
        ]
      },
      {
        "id": "60e71c9ad54b755a3b53eb66",
        "minPlayerLevel": 45,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Cleaner",
        "name": "The Cleaner",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0d4e61d09282029f53920e",
              "name": "The Guide"
            }
          }
        ]
      },
      {
        "id": "60e71dc0a94be721b065bbfc",
        "minPlayerLevel": 45,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Long_Line",
        "name": "Long Line",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5ae449d986f774453a54a7e1",
              "name": "Supervisor"
            }
          }
        ]
      },
      {
        "id": "60e71d23c1bfa3050473b8e6",
        "minPlayerLevel": 47,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Calibration",
        "name": "Calibration",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5f04886a3937dc337a6b8238",
              "name": "Chemistry Closet"
            }
          }
        ]
      },
      {
        "id": "60e71c48c1bfa3050473b8e5",
        "minPlayerLevel": 48,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Crisis",
        "name": "Crisis",
        "trader": {
          "name": "Therapist"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5c0d0d5086f774363760aef2",
              "name": "Athlete"
            }
          }
        ]
      },
      {
        "id": "5c51aac186f77432ea65c552",
        "minPlayerLevel": 48,
        "kappaRequired": true,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Collector",
        "name": "Collector",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5bc4893c86f774626f5ebf3e",
              "name": "The Tarkov Shooter - Part 8"
            }
          },
          {
            "task": {
              "id": "5eaaaa7c93afa0558f3b5a1c",
              "name": "The Survivalist Path - Junkie"
            }
          },
          {
            "task": {
              "id": "5d25e43786f7740a212217fa",
              "name": "The Huntsman Path - Justice"
            }
          },
          {
            "task": {
              "id": "5d25e2d886f77442734d335e",
              "name": "The Huntsman Path - Controller"
            }
          },
          {
            "task": {
              "id": "5d25e44386f77409453bce7b",
              "name": "The Huntsman Path - Evil Watchman"
            }
          },
          {
            "task": {
              "id": "66b38e144f2ab7cc530c3fe7",
              "name": "Every Hunter Knows This"
            }
          },
          {
            "task": {
              "id": "669fa3979b0ce3feae01a130",
              "name": "Claustrophobia"
            }
          },
          {
            "task": {
              "id": "675c1ec7a46173572a0bf20a",
              "name": "Rite of Passage"
            }
          },
          {
            "task": {
              "id": "59674cd986f7744ab26e32f2",
              "name": "Shootout Picnic"
            }
          },
          {
            "task": {
              "id": "5fd9fad9c1ce6b1a3b486d00",
              "name": "Search Mission"
            }
          },
          {
            "task": {
              "id": "675c3507a06634b5110e3c18",
              "name": "Belka and Strelka"
            }
          },
          {
            "task": {
              "id": "596b455186f77457cb50eccb",
              "name": "Stirrup"
            }
          },
          {
            "task": {
              "id": "596a218586f77420d232807c",
              "name": "Car Repair"
            }
          },
          {
            "task": {
              "id": "669fa399033a3ce9870338a8",
              "name": "Possessor"
            }
          },
          {
            "task": {
              "id": "596760e186f7741e11214d58",
              "name": "Postman Pat - Part 2"
            }
          },
          {
            "task": {
              "id": "5ac3475486f7741d6224abd3",
              "name": "Bad Habit"
            }
          },
          {
            "task": {
              "id": "5ac3479086f7742880308199",
              "name": "Insider"
            }
          },
          {
            "task": {
              "id": "60c0c018f7afb4354815096a",
              "name": "The Huntsman Path - Factory Chief"
            }
          },
          {
            "task": {
              "id": "626bd75e47ea7f506e5493c5",
              "name": "Broadcast - Part 1"
            }
          },
          {
            "task": {
              "id": "669fa39c64ea11e84c0642a6",
              "name": "The Walls Have Eyes"
            }
          },
          {
            "task": {
              "id": "669fa39ee749756c920d02c8",
              "name": "All Is Revealed"
            }
          },
          {
            "task": {
              "id": "675c1570526ff496850895d9",
              "name": "Passion for Ergonomics"
            }
          },
          {
            "task": {
              "id": "5c0bde0986f77479cf22c2f8",
              "name": "A Shooter Born in Heaven"
            }
          },
          {
            "task": {
              "id": "60896888e4a85c72ef3fa300",
              "name": "Classified Technologies"
            }
          },
          {
            "task": {
              "id": "6089732b59b92115597ad789",
              "name": "Surplus Goods"
            }
          },
          {
            "task": {
              "id": "6179b4d1bca27a099552e04e",
              "name": "Revision - Lighthouse"
            }
          },
          {
            "task": {
              "id": "5ac346e886f7741d6118b99b",
              "name": "Signal - Part 4"
            }
          },
          {
            "task": {
              "id": "6089743983426423753cd58a",
              "name": "Safe Corridor"
            }
          },
          {
            "task": {
              "id": "669fa3a08b4a64b332041ff7",
              "name": "Dragnet"
            }
          },
          {
            "task": {
              "id": "608974af4b05530f55550c21",
              "name": "Inventory Check"
            }
          },
          {
            "task": {
              "id": "6179b3bdc7560e13d23eeb8d",
              "name": "Corporate Secrets"
            }
          },
          {
            "task": {
              "id": "675c085d59b0575973005f52",
              "name": "Break the Deal"
            }
          },
          {
            "task": {
              "id": "675c04f4db8807b75d0f38e8",
              "name": "Closer to the People"
            }
          },
          {
            "task": {
              "id": "5a27ba1c86f77461ea5a3c56",
              "name": "The Cult - Part 2"
            }
          },
          {
            "task": {
              "id": "6179acbdc760af5ad2053585",
              "name": "Easy Job - Part 2"
            }
          },
          {
            "task": {
              "id": "626bd75c71bd851e971b82a5",
              "name": "Reconnaissance"
            }
          },
          {
            "task": {
              "id": "60896b7bfa70fc097863b8f5",
              "name": "Documents"
            }
          },
          {
            "task": {
              "id": "61904daa7d0d857927447b9c",
              "name": "The Hermit"
            }
          },
          {
            "task": {
              "id": "669fa3a3ad7f1eac2607ed48",
              "name": "Health Care Privacy - Part 6"
            }
          },
          {
            "task": {
              "id": "5b478ff486f7744d184ecbbf",
              "name": "Vitamins - Part 2"
            }
          },
          {
            "task": {
              "id": "6179ad0a6e9dd54ac275e3f2",
              "name": "The Huntsman Path - Outcasts"
            }
          },
          {
            "task": {
              "id": "5edac63b930f5454f51e128b",
              "name": "TerraGroup Employee"
            }
          },
          {
            "task": {
              "id": "5b478d0f86f7744d190d91b5",
              "name": "Minibus"
            }
          },
          {
            "task": {
              "id": "675c3582f6ddc329a90f9c6d",
              "name": "Private Club"
            }
          },
          {
            "task": {
              "id": "5d25e46e86f77409453bce7c",
              "name": "Ambulance"
            }
          },
          {
            "task": {
              "id": "5c0bd01e86f7747cdd799e56",
              "name": "Insomnia"
            }
          },
          {
            "task": {
              "id": "6179b3a12153c15e937d52bc",
              "name": "Energy Crisis"
            }
          },
          {
            "task": {
              "id": "5ae4499a86f77449783815db",
              "name": "Charisma Brings Success"
            }
          },
          {
            "task": {
              "id": "5d4bec3486f7743cac246665",
              "name": "Regulated Materials"
            }
          },
          {
            "task": {
              "id": "5ae449a586f7744bde357696",
              "name": "No Fuss Needed"
            }
          },
          {
            "task": {
              "id": "626bd75b05f287031503c7f6",
              "name": "Drug Trafficking"
            }
          },
          {
            "task": {
              "id": "5d25e4b786f77408251c4bfc",
              "name": "Fishing Place"
            }
          },
          {
            "task": {
              "id": "5c112d7e86f7740d6f647486",
              "name": "Scavenger"
            }
          },
          {
            "task": {
              "id": "5c1141f386f77430ff393792",
              "name": "Living High is Not a Crime - Part 2"
            }
          },
          {
            "task": {
              "id": "5c1128e386f7746565181106",
              "name": "Fertilizers"
            }
          },
          {
            "task": {
              "id": "5d25e45e86f77408251c4bfa",
              "name": "The Huntsman Path - Eraser - Part 2"
            }
          },
          {
            "task": {
              "id": "6179b4f16e9dd54ac275e407",
              "name": "Missing Cargo"
            }
          },
          {
            "task": {
              "id": "5c0d4c12d09282029f539173",
              "name": "Peacekeeping Mission"
            }
          },
          {
            "task": {
              "id": "5d25e4ca86f77409dd5cdf2c",
              "name": "Hunting Trip"
            }
          },
          {
            "task": {
              "id": "5c0d1c4cd0928202a02a6f5c",
              "name": "Decontamination Service"
            }
          },
          {
            "task": {
              "id": "5c0bdb5286f774166e38eed4",
              "name": "Flint"
            }
          },
          {
            "task": {
              "id": "5c0be13186f7746f016734aa",
              "name": "Psycho Sniper"
            }
          },
          {
            "task": {
              "id": "5c12452c86f7744b83469073",
              "name": "Perfect Mediator"
            }
          },
          {
            "task": {
              "id": "5c139eb686f7747878361a6f",
              "name": "Import"
            }
          },
          {
            "task": {
              "id": "626bdcc3a371ee3a7a3514c5",
              "name": "Stray Dogs"
            }
          },
          {
            "task": {
              "id": "5b47825886f77468074618d3",
              "name": "Gunsmith - Part 22"
            }
          },
          {
            "task": {
              "id": "5ae449d986f774453a54a7e1",
              "name": "Supervisor"
            }
          },
          {
            "task": {
              "id": "5c0d4e61d09282029f53920e",
              "name": "The Guide"
            }
          },
          {
            "task": {
              "id": "675c1ff1a757ddd00404f0aa",
              "name": "Test Drive - Part 6"
            }
          },
          {
            "task": {
              "id": "60e71bb4e456d449cd47ca75",
              "name": "Intimidator"
            }
          },
          {
            "task": {
              "id": "60e71c48c1bfa3050473b8e5",
              "name": "Crisis"
            }
          }
        ]
      },
      {
        "id": "60e71c11d54b755a3b53eb65",
        "minPlayerLevel": 50,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Night_Sweep",
        "name": "Night Sweep",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5edabd13218d181e29451442",
              "name": "Rigged Game"
            }
          }
        ]
      },
      {
        "id": "60effd818b669d08a35bfad5",
        "minPlayerLevel": 50,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Choice",
        "name": "The Choice",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca2eb686f77445a80ed049",
              "name": "The Punisher - Part 6"
            }
          }
        ]
      },
      {
        "id": "60e729cf5698ee7b05057439",
        "minPlayerLevel": 50,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Swift_One",
        "name": "Swift One",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5edab4b1218d181e29451435",
              "name": "The Huntsman Path - Sadist"
            }
          }
        ]
      },
      {
        "id": "60e71dc67fcf9c556f325056",
        "minPlayerLevel": 50,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Booze",
        "name": "Booze",
        "trader": {
          "name": "Ragman"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "60e71dc0a94be721b065bbfc",
              "name": "Long Line"
            }
          }
        ]
      },
      {
        "id": "60e71d6d7fcf9c556f325055",
        "minPlayerLevel": 52,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Courier",
        "name": "The Courier",
        "trader": {
          "name": "Mechanic"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "60e71d23c1bfa3050473b8e6",
              "name": "Calibration"
            }
          }
        ]
      },
      {
        "id": "60e71ccb5688f6424c7bfec4",
        "minPlayerLevel": 55,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Trophies",
        "name": "Trophies",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2cc86f77443e47ae019",
              "name": "The Huntsman Path - Forest Cleaning"
            }
          },
          {
            "task": {
              "id": "5a27b75b86f7742e97191958",
              "name": "Fishing Gear"
            }
          }
        ]
      },
      {
        "id": "60e71b62a0beca400d69efc4",
        "minPlayerLevel": 60,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Escort",
        "name": "Escort",
        "trader": {
          "name": "Prapor"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "59ca2eb686f77445a80ed049",
              "name": "The Punisher - Part 6"
            }
          }
        ]
      },
      {
        "id": "60e71ce009d7c801eb0c0ec6",
        "minPlayerLevel": 60,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Special_Equipment",
        "name": "Special Equipment",
        "trader": {
          "name": "Peacekeeper"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "60e71ccb5688f6424c7bfec4",
              "name": "Trophies"
            }
          }
        ]
      },
      {
        "id": "67af4c1405c58dc6f7056667",
        "minPlayerLevel": 61,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Profitable_Venture",
        "name": "Profitable Venture",
        "trader": {
          "name": "Skier"
        }
      },
      {
        "id": "67af4c169d95ad16e004fd86",
        "minPlayerLevel": 61,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Safety_Guarantee",
        "name": "Safety Guarantee",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67af4c1405c58dc6f7056667",
              "name": "Profitable Venture"
            }
          }
        ]
      },
      {
        "id": "67af4c17f4f1fb58a907f8f6",
        "minPlayerLevel": 61,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Never_Too_Late_To_Learn",
        "name": "Never Too Late To Learn",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67af4c169d95ad16e004fd86",
              "name": "Safety Guarantee"
            }
          }
        ]
      },
      {
        "id": "67af4c1991ee75c6d7060a16",
        "minPlayerLevel": 61,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Get_a_Foothold",
        "name": "Get a Foothold",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67af4c17f4f1fb58a907f8f6",
              "name": "Never Too Late To Learn"
            }
          }
        ]
      },
      {
        "id": "67af4c1a6c3ebfd8e6034916",
        "minPlayerLevel": 61,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Profit_Retention",
        "name": "Profit Retention",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67af4c1991ee75c6d7060a16",
              "name": "Get a Foothold"
            }
          }
        ]
      },
      {
        "id": "67af4c1cc0e59d55e2010b97",
        "minPlayerLevel": 61,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/A_Life_Lesson",
        "name": "A Life Lesson",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67af4c1a6c3ebfd8e6034916",
              "name": "Profit Retention"
            }
          }
        ]
      },
      {
        "id": "67af4c1d8c9482eca103e477",
        "minPlayerLevel": 61,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Consolation_Prize",
        "name": "Consolation Prize",
        "trader": {
          "name": "Skier"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "67af4c1cc0e59d55e2010b97",
              "name": "A Life Lesson"
            }
          }
        ]
      },
      {
        "id": "60e71e8ed54b755a3b53eb67",
        "minPlayerLevel": 65,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/The_Huntsman_Path_-_Relentless",
        "name": "The Huntsman Path - Relentless",
        "trader": {
          "name": "Jaeger"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "5d25e2c386f77443e7549029",
              "name": "The Huntsman Path - Trophy"
            }
          },
          {
            "task": {
              "id": "60c0c018f7afb4354815096a",
              "name": "The Huntsman Path - Factory Chief"
            }
          },
          {
            "task": {
              "id": "5d25e2ee86f77443e35162ea",
              "name": "The Huntsman Path - Woods Keeper"
            }
          },
          {
            "task": {
              "id": "5d25e44f86f77443e625e385",
              "name": "The Huntsman Path - Eraser - Part 1"
            }
          },
          {
            "task": {
              "id": "5edab4b1218d181e29451435",
              "name": "The Huntsman Path - Sadist"
            }
          },
          {
            "task": {
              "id": "5d25e2e286f77444001e2e48",
              "name": "The Huntsman Path - Sellout"
            }
          }
        ]
      },
      {
        "id": "61e6e5e0f5b9633f6719ed95",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Compensation_for_Damage_-_Trust",
        "name": "Compensation for Damage - Trust",
        "trader": {
          "name": "Fence"
        }
      },
      {
        "id": "61e6e60223374d168a4576a6",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Compensation_for_Damage_-_Wager",
        "name": "Compensation for Damage - Wager",
        "trader": {
          "name": "Fence"
        }
      },
      {
        "id": "61e6e615eea2935bc018a2c5",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Compensation_for_Damage_-_Barkeep",
        "name": "Compensation for Damage - Barkeep",
        "trader": {
          "name": "Fence"
        }
      },
      {
        "id": "61e6e621bfeab00251576265",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Compensation_for_Damage_-_Collection",
        "name": "Compensation for Damage - Collection",
        "trader": {
          "name": "Fence"
        }
      },
      {
        "id": "66631489acf8442f8b05319f",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Friend_Among_Strangers",
        "name": "Friend Among Strangers",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6672d9def1c88688a707d042",
              "name": "Establish Contact"
            }
          }
        ]
      },
      {
        "id": "6663148ca9290f9e0806cca1",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Immunity",
        "name": "Immunity",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "66631489acf8442f8b05319f",
              "name": "Friend Among Strangers"
            }
          }
        ]
      },
      {
        "id": "6663148ed7f171c4c20226c1",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Small_Business_-_Part_1",
        "name": "Small Business - Part 1",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6663148ca9290f9e0806cca1",
              "name": "Immunity"
            }
          }
        ]
      },
      {
        "id": "6663149196a9349baa021baa",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Small_Business_-_Part_2",
        "name": "Small Business - Part 2",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6663148ed7f171c4c20226c1",
              "name": "Small Business - Part 1"
            }
          }
        ]
      },
      {
        "id": "66631493312343839d032d22",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Small_Business_-_Part_3",
        "name": "Small Business - Part 3",
        "trader": {
          "name": "Fence"
        },
        "taskRequirements": [
          {
            "task": {
              "id": "6663149196a9349baa021baa",
              "name": "Small Business - Part 2"
            }
          }
        ]
      },
      {
        "id": "6672d9def1c88688a707d042",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Establish_Contact",
        "name": "Establish Contact",
        "trader": {
          "name": "Fence"
        }
      },
      {
        "id": "61e6e60c5ca3b3783662be27",
        "minPlayerLevel": 0,
        "kappaRequired": false,
        "lightkeeperRequired": false,
        "taskRequirements": [],
        "wikiLink": "https://escapefromtarkov.fandom.com/wiki/Compensation_for_Damage_-_Wergild",
        "name": "Compensation for Damage - Wergild",
        "trader": {
          "name": "Fence"
        }
      }
    ]
  }
};
