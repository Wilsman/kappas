# 1.0 Storyline Quests - Full Implementation Plan

## Current Status (Phase 1 - Completed)
✅ Created informational page showing how to start each storyline quest
✅ Added routing and navigation for `/Storyline` view
✅ Integrated with sidebar and command menu navigation

## Phase 2: Data Structure & Storage
**Goal:** Add proper data models and persistence for storyline quest tracking

### Tasks:
1. **Create Storyline Quest Type Definition** (`src/types/index.ts`)
   - Define `StorylineQuest` interface with:
     - `id: string` - Unique identifier
     - `name: string` - Quest name
     - `description: string` - How to start/trigger
     - `icon: string` - Emoji or icon identifier
     - `prerequisites?: string[]` - Quest IDs that must be completed first
     - `objectives?: StorylineObjective[]` - Quest objectives
     - `rewards?: StorylineReward[]` - Quest rewards
     - `completed?: boolean` - Completion status

2. **Add IndexedDB Storage** (`src/utils/indexedDB.ts`)
   - Add `completedStorylineQuests` to profile storage schema
   - Create CRUD operations:
     - `loadStorylineQuestProgress(profileId: string): Promise<Set<string>>`
     - `saveStorylineQuestProgress(profileId: string, completed: Set<string>): Promise<void>`
     - `toggleStorylineQuest(profileId: string, questId: string): Promise<void>`

3. **Update Profile Migration**
   - Ensure new profiles include `completedStorylineQuests: Set<string>` field
   - Add migration for existing profiles

## Phase 3: UI Enhancements
**Goal:** Add interactive tracking to the storyline quests page

### Tasks:
1. **Update StorylineQuestsView Component**
   - Add props for completion state:
     - `completedQuests: Set<string>`
     - `onToggleComplete: (questId: string) => void`
   - Add checkbox/toggle UI for each quest card
   - Add visual indicators for completed quests (checkmark, opacity, strikethrough)
   - Add filter/sort options:
     - Show all / Show incomplete / Show completed
     - Sort by order / Sort by completion status

2. **Add Progress Stats**
   - Create header stats showing:
     - Total quests: 8
     - Completed: X/8
     - Progress percentage
   - Add progress bar visualization

3. **Add Search/Filter**
   - Implement search functionality to filter quests by name/description
   - Use `useQueryState` for URL-based search persistence

## Phase 4: Integration with Main App
**Goal:** Integrate storyline quest progress with overall app progress tracking

### Tasks:
1. **Update App.tsx State Management**
   - Add state: `const [completedStorylineQuests, setCompletedStorylineQuests] = useState<Set<string>>(new Set())`
   - Add load/save handlers similar to regular quests
   - Pass state to `StorylineQuestsView` component

2. **Update QuestProgressPanel**
   - Add optional props:
     - `totalStorylineQuests?: number`
     - `completedStorylineQuests?: number`
   - Add storyline progress section to the panel (similar to Kappa/Lightkeeper)
   - Display: "📖 Storyline: X/8"

3. **Update Focus Mode**
   - Consider adding "Storyline" as a focus mode option
   - Filter/highlight storyline-related content when active

## Phase 5: Advanced Features (Future)
**Goal:** Enhanced storyline quest experience

### Potential Features:
1. **Quest Dependencies Visualization**
   - Show prerequisite chains (e.g., "Falling Skies" → "The Ticket")
   - Disable/gray out quests that can't be started yet

2. **Integration with Regular Quests**
   - Link storyline quests to related regular quests
   - Show which regular quests are part of storyline chains

3. **Map Integration**
   - Add map markers showing quest trigger locations
   - Interactive map view for quest locations

4. **Notes & Tips**
   - Allow users to add personal notes to each quest
   - Community tips/hints integration

5. **Completion Rewards Tracking**
   - Track rewards received from storyline quests
   - Show what you've earned from completing storylines

## Implementation Order
1. ✅ Phase 1: Information page (COMPLETED)
2. Phase 2: Data structure & storage (NEXT)
3. Phase 3: UI enhancements
4. Phase 4: App integration
5. Phase 5: Advanced features (as needed)

## Technical Considerations
- **Performance:** Storyline quests are a small dataset (8 items), no performance concerns
- **Data Source:** Currently hardcoded; consider future API integration if Tarkov.dev adds storyline quest data
- **Mobile:** Ensure responsive design works well on mobile devices
- **Accessibility:** Add proper ARIA labels for checkboxes and progress indicators
- **Testing:** Add unit tests for storage operations and component interactions

## Notes
- Keep storyline quest data separate from regular quest data to avoid confusion
- Consider adding a "Storyline" badge/filter to regular quests that are part of storyline chains
- Monitor community feedback for additional quest information or corrections
