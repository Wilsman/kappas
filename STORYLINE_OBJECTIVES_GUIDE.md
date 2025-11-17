# How to Add Objectives to Storyline Chapters

## Quick Start

Adding objectives to any storyline chapter is simple. Just add an `objectives` array to the quest object in `StorylineQuestsView.tsx`.

## Example: Adding Objectives

```typescript
{
  id: "chapter-name",
  name: "Chapter Name",
  description: "How to trigger this chapter...",
  icon: "/X.png",
  objectives: [
    // Main objectives
    {
      id: "chapter-main-1",
      type: "main",
      description: "Do something important"
    },
    {
      id: "chapter-main-2",
      type: "main",
      description: "Collect items",
      progress: { current: 0, required: 5 }  // Shows progress bar
    },
    {
      id: "chapter-main-3",
      type: "main",
      description: "Hand over weapon",
      progress: { current: 0, required: 2 },
      notes: "Items must have Found in Raid mark"  // Shows hint below
    },
    
    // Optional objectives
    {
      id: "chapter-opt-1",
      type: "optional",
      description: "Optional task",
      progress: { current: 0, required: 3 }
    }
  ],
  rewards: {
    description: "What you unlock after completing this chapter"
  }
}
```

## Field Reference

### Objective Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (e.g., "tour-main-1") |
| `type` | "main" \| "optional" | ✅ | Objective category |
| `description` | string | ✅ | What the player needs to do |
| `progress` | object | ❌ | For countable objectives (e.g., 3/5 kills) |
| `progress.current` | number | ❌ | Current progress (usually 0) |
| `progress.required` | number | ❌ | Required amount |
| `notes` | string | ❌ | Additional hints or requirements |

### Rewards Field

```typescript
rewards: {
  description: string;  // What the player unlocks
  items?: string[];     // Optional: List of specific items (future use)
}
```

## UI Behavior

### Collapsible Sections
- **Main Objectives**: Expanded by default (green theme)
- **Optional Objectives**: Collapsed by default (blue theme)
- Click the header to toggle expand/collapse

### Progress Bars
- Automatically shown when `progress` field is present
- Displays as: `████ 3/5` or `0/250,000`
- Numbers are formatted with commas for readability

### Visual Styling
- **Main**: Green accent (`text-green-600`)
- **Optional**: Blue accent (`text-blue-600`)
- **Rewards**: Purple accent with 💎 emoji
- **Notes**: Small italic text below objective

## Tips

### ID Naming Convention
```
{questId}-{type}-{number}

Examples:
- tour-main-1
- tour-main-2
- tour-opt-1
- batya-main-1
```

### Progress Values
For currency, use full numbers:
```typescript
progress: { current: 0, required: 250000 }
// Displays as: 0/250,000
```

For items/kills, use small numbers:
```typescript
progress: { current: 0, required: 3 }
// Displays as: 0/3
```

### When to Use Notes
- Item requirements (e.g., "Found in Raid")
- Location hints
- Special conditions
- Warnings about bugs

## Example: Complete Chapter

```typescript
{
  id: "falling-skies",
  name: "Falling Skies",
  description: "Best method: Keep doing Tour until completing Mechanic's quest, then go to the broken plane in Woods",
  notes: "⚠️ Known Issues:\n• Quest is rumored to be bugged\n• May require Prapor LVL 2",
  icon: "/2.png",
  objectives: [
    {
      id: "falling-main-1",
      type: "main",
      description: "Locate the crashed plane in Woods"
    },
    {
      id: "falling-main-2",
      type: "main",
      description: "Search the plane wreckage"
    },
    {
      id: "falling-main-3",
      type: "main",
      description: "Survive and extract"
    }
  ],
  rewards: {
    description: "Unlocks The Ticket quest automatically"
  }
}
```

## Future Enhancements

The current structure supports future features without changes:
- ✅ Objective completion tracking (add `completed?: boolean`)
- ✅ Progress updates (modify `progress.current`)
- ✅ Objective filtering/search
- ✅ Per-profile progress persistence

## Need Help?

1. Check `STORYLINE_OBJECTIVES_DESIGN.md` for detailed design docs
2. Look at the Tour chapter for a complete example
3. All objectives are in `src/components/StorylineQuestsView.tsx`
