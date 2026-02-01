# User Data Persistence Debugging Guide

This document outlines the debugging tools available for diagnosing user data persistence issues (e.g., "tasks not saving", "progress resets on refresh").

## The Problem

Users report issues where their quest progress appears to be lost after:
- Refreshing the page
- Closing and reopening the browser
- Restarting their computer

Common symptoms:
- "I mark tasks as complete but they disappear"
- "I had Kappa completed but now it's all gone"
- "Tasks keep resetting every day"

## Available Debugging Tools

### 1. Browser Console Command

Users can generate a comprehensive diagnostic report by running a simple command in the browser console.

**For Users:**
1. Press `F12` to open browser developer tools
2. Click the "Console" tab
3. Type: `debugTracker()`
4. Press Enter
5. A text file will automatically download with full diagnostics

**What the Report Includes:**
- **Profile Information**: All profiles, active profile, deleted/archived profiles
- **IndexedDB Diagnostics**: 
  - Database existence check
  - Object store item counts (tasks, collector items, hideout items, etc.)
  - Sample data keys for verification
- **Storage Persistence**: Whether browser will auto-clear data
- **Storage Quota**: Usage vs available space
- **LocalStorage**: All app-related keys and values
- **Data Summary**: Complete export of current profile data
- **⚠️ Warnings**: Automatically detected issues
- **💡 Recommendations**: Specific advice based on findings

### Before/After Workflow (For Data Loss Issues)

When troubleshooting "tasks disappear after refresh", **ask users to export twice**:

1. **Export #1 - BEFORE the problem**: 
   - User marks tasks as complete
   - Click "Export Debug Data" 
   - Add context: "before refresh - all tasks done"

2. **Export #2 - AFTER the problem**:
   - User refreshes the page
   - Tasks are now missing
   - Click "Export Debug Data" again
   - Add context: "after refresh - tasks missing"

3. **Compare the two reports**:
   - Export #1 should show `completedTasks: 50 items`
   - Export #2 should show `completedTasks: 0 items`
   - This proves data was saved but then lost
   - Check if `Is Persisted` changed between exports

The exported files are named with export numbers (e.g., `export1`, `export2`) to make comparison easy.

### 2. UI Button

An "Export Debug Data" button is available in the sidebar footer (above the Discord badge). Clicking it generates the same diagnostic report without needing to use the console.

**Location**: Sidebar footer → "Export Debug Data" button (amber/yellow styled)

### 3. Notes Access

Users can access their profile-specific notes via:
- Sidebar footer "My Notes" button
- Keyboard shortcut: `Ctrl+Shift+U`

## Common Issues & Diagnoses

### Issue: Database Doesn't Exist
**Debug Report Indicator**: `DB Exists: NO`

**Cause**: 
- Browser cleared IndexedDB (storage quota exceeded, privacy settings)
- First-time user
- Profile ID mismatch

**Solution**:
- Check browser settings for storage permissions
- Verify user is on correct profile
- Restore from backup if available

### Issue: Storage Not Persisted
**Debug Report Indicator**: `Is Persisted: NO`

**Cause**: 
- Browser not granted persistent storage permission
- Data may be cleared by browser automatically (especially in private/incognito mode)

**Solution**:
- Guide user to enable persistent storage in browser settings
- Avoid using private/incognito mode
- Use the export/import feature regularly for backup

### Issue: Empty Database
**Debug Report Indicator**: 
- `DB Exists: YES`
- `completedTasks: 0 items`
- Warning: "Database exists but 'completedTasks' store is empty"

**Cause**:
- Data was never successfully saved
- Save operation failed silently
- Database corruption

**Solution**:
- Check browser console for JavaScript errors during task completion
- Verify IndexedDB isn't in read-only mode
- Test by completing a task and immediately refreshing

### Issue: Wrong Profile Active
**Debug Report Indicator**: Multiple profiles listed, but active profile shows low/no task completion

**Cause**:
- User has multiple profiles and is on the wrong one
- Profile switching occurred unintentionally

**Solution**:
- Switch to correct profile via sidebar selector
- Rename profiles for clarity
- Delete unused profiles

### Issue: Storage Quota Exceeded
**Debug Report Indicator**: Usage ratio > 90%

**Cause**:
- Browser storage limit reached
- Other websites using significant storage

**Solution**:
- Clear storage for other sites
- Export data and re-import to clean up
- Use "Export All Profiles" to backup and reset

## Data Storage Architecture

Understanding where data lives helps diagnose issues:

### IndexedDB (Primary Storage)
**Location**: Profile-specific databases (`TarkovQuests_<profileId>`)

**Stores**:
- `completedTasks` - Quest completion status
- `completedCollectorItems` - Collector item progress
- `completedHideoutItems` - Hideout upgrade items
- `completedAchievements` - Achievement unlocks
- `completedStorylineObjectives` - Storyline quest objectives
- `completedStorylineMapNodes` - Storyline map node completion
- `completedTaskObjectives` - Individual task objective completion
- `taskObjectiveItemProgress` - Item collection progress within objectives
- `hideoutItemQuantities` - Hideout item quantities
- `prestigeProgress` - Prestige progression data
- `userPreferences` - Notes, player level, filters
- `workingOnItems` - "Working On" tracked items

### localStorage (Legacy & Metadata)
**Keys**:
- `taskTracker_profiles_v1` - Profile metadata (names, levels, factions)
- `taskTracker_activeProfile_v1` - Currently active profile ID
- `taskTracker_deletedProfiles_v1` - Deleted/archived profile IDs
- `taskTracker_onboarding_shown` - Onboarding flag

## Migration History

The app has undergone several storage migrations:

1. **Legacy → Profile-scoped** (v1): Migrated from single `TarkovQuests` DB to per-profile databases
2. **Default DB cleanup**: Handles edge cases where data saved to wrong database
3. **localStorage → IndexedDB**: User preferences (notes, level) moved to IndexedDB

Migration flags are stored in localStorage to prevent re-migration.

## Example Debug Reports

### Healthy Profile (with warnings)

Below is an example of a working profile that has data properly saved, but with a warning about storage persistence:

```
================================================================================
ESCAPE FROM TARKOV QUEST TRACKER - DEBUG REPORT
================================================================================

GENERAL INFORMATION
----------------------------------------
Generated: 2026-02-01T17:41:45.527Z
URL: http://localhost:5173/
User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 

PROFILES
----------------------------------------
Total Profiles: 2
Active Profile ID: 1a046dcc-f85d-4051-9017-2ae1b0422a3a
Active Profile Name: Default
Active Profile Faction: USEC
Active Profile Level: 1
Active Profile Edition: edge_of_darkness

STORAGE DIAGNOSTICS
----------------------------------------

IndexedDB:
  Current Profile DB: TarkovQuests_1a046dcc-f85d-4051-9017-2ae1b0422a3a
  DB Exists: YES

  Object Stores:
    - completedTasks: 8 items
      Sample keys: 5ac23c6186f7741247042bad, 5ac345dc86f774288030817f, ...
    - completedCollectorItems: 0 items
    - completedHideoutItems: 0 items
    - userPreferences: 5 items
    - workingOnItems: 4 items
    ...

Storage Persistence:
  Is Persisted: NO
  Usage: 563.36 KB
  Quota: 278.55 GB

CURRENT PROFILE DATA SUMMARY
----------------------------------------
Completed Tasks: 8
Completed Collector Items: 0
Completed Hideout Items: 0
Player Level: 1
Show Completed: true
Notes Length: 0 chars

⚠️  WARNINGS
----------------------------------------
  ! Storage is NOT persisted - browser may clear data automatically

💡 RECOMMENDATIONS
----------------------------------------
  • Consider enabling persistent storage in your browser settings
  • You have 2 profiles. Active: "Default". Make sure you're using correct profile.
```

**Analysis of this report**:
- ✅ **Data is present**: 8 completed tasks saved properly
- ✅ **Database exists**: `TarkovQuests_1a046dcc-f85d-4051-9017-2ae1b0422a3a` found
- ⚠️ **Storage not persisted**: Warning issued, but data is currently intact
- ℹ️ **Multiple profiles**: User has 2 profiles, but is on the correct "Default" one

This shows a healthy profile that may be at risk if the browser decides to clear storage (due to "Is Persisted: NO").

### Problem Profile (data loss scenario)

```
PROFILES
----------------------------------------
Total Profiles: 1
Active Profile ID: abc-123
Active Profile Name: My Character

STORAGE DIAGNOSTICS
----------------------------------------
IndexedDB:
  Current Profile DB: TarkovQuests_abc-123
  DB Exists: NO

⚠️  WARNINGS
----------------------------------------
  ! Database 'TarkovQuests_abc-123' does not exist - no data has been saved
```

**Analysis**: Database doesn't exist at all - this indicates either:
- User's first visit
- Browser cleared all storage
- Data was never successfully saved

## Support Workflow

### For General Issues

When a user reports data loss:

1. **Ask for Debug Report**: Have them run `debugTracker()` in console or click "Export Debug Data" button
2. **Analyze Key Indicators**:
   - DB exists? (if NO → browser/storage issue)
   - Is persisted? (if NO → may auto-clear)
   - Item counts (if 0 → data never saved or was cleared)
   - Multiple profiles? (wrong profile possible)
3. **Check for Warnings**: The report auto-generates warnings based on findings
4. **Provide Specific Guidance**: Use the recommendations section
5. **Data Recovery**: If backup exists, guide import process

### For "Data Disappears After Refresh" Issues

This is the most common and tricky issue. **Always ask for TWO exports**:

**Step 1 - Reproduce the Issue:**
```
User: "I complete 20 tasks, refresh, and they're gone"

You: "Please do this:
1. Mark a few tasks complete
2. Click 'Export Debug Data' (Export #1)
3. Add context: 'before refresh - X tasks done'
4. Refresh the page
5. Click 'Export Debug Data' again (Export #2)
6. Add context: 'after refresh - tasks missing'
7. Send me both files"
```

**Step 2 - Compare the Reports:**

Look for these key differences between Export #1 and Export #2:

| Field | Export #1 (Before) | Export #2 (After) | Diagnosis |
|-------|-------------------|-------------------|-----------|
| `completedTasks` | 20 items | 0 items | ✅ Data was saved but cleared on refresh |
| `DB Exists` | YES | NO | ⚠️ Database was deleted/dropped |
| `Is Persisted` | NO | NO | ⚠️ Storage not persisted (browser cleared it) |
| `Quota` | 99% full | 0% | ⚠️ Storage quota issue |

**Step 3 - Determine Root Cause:**

**If Export #1 has data and Export #2 has 0 items:**
- Data was successfully saved but then lost
- Check if `Is Persisted` changed
- Ask if user cleared browser data or is in incognito mode

**If Export #1 already has 0 items:**
- Data was never saved in the first place
- Check for JavaScript errors in console during task completion
- Check if IndexedDB is disabled by browser settings

**If `DB Exists` changed from YES to NO:**
- Browser aggressively cleared storage
- Recommend enabling persistent storage
- User may have "Clear site data on close" enabled

### Example Support Conversation

**User:** "My Kappa progress keeps resetting every day!"

**You:** "I need to see what's happening. Can you:

1. **Right now** - go mark 3-4 tasks as complete
2. Click the **'Export Debug Data'** button in the sidebar
3. Type: `before refresh - just marked tasks`
4. Refresh your browser
5. Click **'Export Debug Data'** again  
6. Type: `after refresh - tasks gone`
7. Send me both files

This will show me exactly what's happening when the data disappears."

**User:** [Sends two files]

**You:** [Compare reports]
- Export #1: `completedTasks: 4 items` ✅ Saved properly
- Export #2: `completedTasks: 0 items` ❌ Data lost!
- Both: `Is Persisted: NO` → Browser clearing storage automatically

**Solution:** Guide user to enable persistent storage in browser settings.

## Prevention Tips for Users

Share these with users experiencing issues:

1. **Enable Persistent Storage**: In Chrome, visit `chrome://settings/content/siteData` and ensure the site can store data
2. **Avoid Incognito/Private Mode**: Data won't persist after closing
3. **Regular Backups**: Use "Export All Profiles" periodically
4. **Check Storage**: If browser storage is full, clear other sites' data
5. **Don't Clear Site Data**: Warns users not to use "Clear browsing data" for this site

## Developer Notes

### Adding Debug Info

To add new diagnostic data to the debug report:

1. Edit `src/utils/debug.ts`
2. Add new fields to `DebugReport` interface
3. Update `generateDebugReport()` to collect the data
4. Update `formatReportAsText()` to include in output
5. Consider adding relevant warnings in `generateWarnings()`

### Testing Data Persistence

Always test data persistence across:
- Page refreshes
- Browser restarts
- Profile switches
- Storage quota scenarios

### Related Files

- `src/utils/debug.ts` - Debug report generation
- `src/utils/indexedDB.ts` - Storage implementation
- `src/utils/profile.ts` - Profile management
- `src/components/app-sidebar.tsx` - UI buttons (Export Debug, My Notes)
- `src/components/NotesWidget.tsx` - Notes panel

---

**Last Updated**: 2026-02-01
**Feature Added**: Debug export tools for data persistence diagnostics
