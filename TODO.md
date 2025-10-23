# TODO - User Feedback

## High Priority

### 1. ✅ Bulk Mark Quests as Complete (Prestige Support) - COMPLETED
**User Request:** Button to mark all quests as done for completed prestiges
- **Problem:** Users starting at Prestige 2 or 3 need to manually click every quest twice to mark previous prestige requirements as complete
- **Solution:** Add "Mark Prestige X Complete" button that auto-completes all quest requirements for that prestige level
- **Implementation:** Added "Complete All" and "Reset" buttons to each prestige card with confirmation dialogs
- **Files Modified:** `src/components/PrestigesView.tsx`

### 2. Found-in-Raid Item Tracker (Quest + Hideout)
**User Request:** Visual interface for all FiR items needed for quests AND hideout upgrades
- **Requirements:**
  - Icon-based interface (not text-heavy like current hideout tab)
  - Larger icons than collector view
  - Show aggregate counts (e.g., "Drill - Need 12 total")
  - Click item to see breakdown: "3 for Quest X, 6 for Hideout Y, 3 for Quest Z"
  - Quick reference for in-raid loot decisions
- **Similar to:** Collector items view but expanded scope
- **New Component:** `src/components/FiRItemsView.tsx`

## Medium Priority

### 3. Kappa Speedrun Quest Order Guide
**User Request:** Sorted list of quests in optimal order for speedrunning Kappa
- **Note:** User acknowledges this is "too much work" and "not super useful"
- **Complexity:** High - requires extensive research on quest combinations and efficiency
- **Decision:** Consider as future enhancement, low priority

## Implementation Notes

### For Item #1 (Bulk Complete):
- Add button in each prestige card: "Mark All Quests Complete"
- Should mark both "Collector" and "New Beginning" as done
- Consider adding confirmation dialog
- May also want "Reset Prestige" button to undo

### For Item #2 (FiR Tracker):
- Query API for all quest objectives requiring FiR items
- Query hideout station requirements
- Aggregate by item ID
- Display with item icons from API
- Modal/popover on click showing detailed breakdown
- Add to main view modes alongside Collector view

