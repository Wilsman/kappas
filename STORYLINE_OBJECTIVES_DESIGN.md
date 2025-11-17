# Storyline Chapter Objectives - Design Document

## Overview
Add main and optional objectives for each storyline chapter with an elegant, expandable UI that's easy to navigate and update.

## Design Goals
1. **Clean & Elegant** - Minimal visual clutter, clear hierarchy
2. **Expandable** - Easy to add/edit objectives as information becomes available
3. **Fast Navigation** - Collapsible sections, quick scanning
4. **Future-Proof** - Support for progress tracking later

---

## Data Structure

### Interface Design
```typescript
interface StorylineObjective {
  id: string;                    // Unique identifier
  description: string;           // Objective text
  type: 'main' | 'optional';    // Objective category
  completed?: boolean;           // For future tracking
  progress?: {                   // For countable objectives
    current: number;
    required: number;
  };
  notes?: string;                // Additional hints/info
}

interface StorylineQuest {
  id: string;
  name: string;
  description: string;           // How to trigger
  icon: string;
  notes?: string;                // Warnings/bugs
  objectives?: StorylineObjective[];  // All objectives
  rewards?: {                    // Quest rewards
    description: string;
    items?: string[];
  };
}
```

### Why This Structure?
- **Single objectives array** - Simpler than separate main/optional arrays
- **Type field** - Easy filtering and styling
- **Progress object** - Supports "3/3", "5/5", "250000/250000" formats
- **Optional fields** - Only add what's needed, no bloat
- **Future-ready** - Supports tracking without breaking changes

---

## UI Design

### Visual Hierarchy
```
┌─────────────────────────────────────────────┐
│ [Icon] Chapter Name                         │
│                                             │
│ How to trigger description...               │
│                                             │
│ ⚠️ Warning box (if applicable)              │
│                                             │
│ ▼ Main Objectives (X)          [Collapse]   │
│   ☐ Objective 1                             │
│   ☐ Objective 2 (with progress) ████ 3/5    │
│   ☐ Objective 3                             │
│                                             │
│ ▼ Optional Objectives (Y)      [Collapse]   │
│   ☐ Optional 1                              │
│   ☐ Optional 2 (with progress) ████ 2/2     │
│                                             │
│ 💎 Rewards                                  │
│   • Access to Shoreline                     │
│   • Buy equipment from Peacekeeper          │
└─────────────────────────────────────────────┘
```

### Component Features
1. **Collapsible Sections**
   - Main objectives: Expanded by default
   - Optional objectives: Collapsed by default
   - Smooth animations

2. **Visual Indicators**
   - ✓ Checkmark for completed (future)
   - Progress bars for countable objectives
   - Different colors: Main (green), Optional (blue)

3. **Smart Display**
   - Hide objectives section if no objectives defined
   - Show count badges (Main: 5, Optional: 3)
   - Compact mode for mobile

---

## Implementation Plan

### Phase 1: Data Structure (Current)
- [x] Design interface
- [ ] Update `StorylineQuest` interface
- [ ] Add Tour chapter objectives from screenshot
- [ ] Validate data structure

### Phase 2: UI Components
- [ ] Create `ObjectivesList` component
- [ ] Add collapsible sections with Accordion
- [ ] Style main vs optional objectives
- [ ] Add progress bars for countable objectives

### Phase 3: Content Population
- [ ] Add all Tour objectives
- [ ] Add objectives for other chapters as discovered
- [ ] Add rewards information

### Phase 4: Future Enhancements
- [ ] Add objective completion tracking
- [ ] Add progress persistence
- [ ] Add objective search/filter
- [ ] Add objective notes/hints

---

## Example Data: Tour Chapter

```typescript
{
  id: "tour",
  name: "Tour",
  description: "Starting quest - automatically unlocked at the beginning of the storyline",
  icon: "/1.png",
  objectives: [
    // Main Objectives
    {
      id: "tour-main-1",
      type: "main",
      description: "Find a way to contact the soldiers at the Terminal"
    },
    {
      id: "tour-main-2",
      type: "main",
      description: "Locate the entrance to the port Terminal"
    },
    {
      id: "tour-main-3",
      type: "main",
      description: "Talk to Skier"
    },
    {
      id: "tour-main-4",
      type: "main",
      description: "Survive and extract from Woods"
    },
    {
      id: "tour-main-5",
      type: "main",
      description: "Eliminate any target on Woods",
      progress: { current: 0, required: 3 }
    },
    // ... more main objectives
    
    // Optional Objectives
    {
      id: "tour-opt-1",
      type: "optional",
      description: "Find any weapon in raid",
      progress: { current: 0, required: 2 }
    },
    {
      id: "tour-opt-2",
      type: "optional",
      description: "Find any item in raid from the Building materials category",
      progress: { current: 0, required: 5 }
    },
    {
      id: "tour-opt-3",
      type: "optional",
      description: "Collect the required amount in RUB",
      progress: { current: 0, required: 250000 }
    }
  ],
  rewards: {
    description: "Access to Shoreline and buy equipment from Peacekeeper"
  }
}
```

---

## UI Component Structure

```
StorylineQuestsView
├── QuestCard (for each chapter)
│   ├── QuestHeader (icon + name)
│   ├── TriggerDescription
│   ├── WarningBox (if notes exist)
│   ├── ObjectivesSection
│   │   ├── MainObjectives (Accordion)
│   │   │   └── ObjectiveItem[]
│   │   └── OptionalObjectives (Accordion)
│   │       └── ObjectiveItem[]
│   └── RewardsSection
```

---

## Styling Guidelines

### Colors
- **Main Objectives**: Green accent (`text-green-600`, `border-green-500/30`)
- **Optional Objectives**: Blue accent (`text-blue-600`, `border-blue-500/30`)
- **Progress Bars**: Match objective type color
- **Completed**: Gray with strikethrough (future)

### Spacing
- Objectives list: `space-y-2`
- Between sections: `space-y-4`
- Padding: Consistent with existing cards

### Typography
- Objective text: `text-sm`
- Progress text: `text-xs text-muted-foreground`
- Section headers: `text-base font-semibold`

---

## Benefits of This Design

1. **Scalable**: Easy to add new chapters and objectives
2. **Maintainable**: Clear data structure, single source of truth
3. **User-Friendly**: Collapsible sections reduce overwhelm
4. **Performance**: Lazy rendering, only show what's needed
5. **Future-Ready**: Built for tracking without refactoring
6. **Accessible**: Keyboard navigation, screen reader friendly

---

## Next Steps

1. Implement the interface updates
2. Create the UI components
3. Add Tour chapter data from screenshot
4. Test responsiveness and UX
5. Document how to add new objectives
