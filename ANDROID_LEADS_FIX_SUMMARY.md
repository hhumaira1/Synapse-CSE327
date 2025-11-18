# Android Leads Implementation - Fix Summary

## Overview
Fixed the incorrect implementation where leads were being moved to pipeline "stages". Leads should have **statuses** (not stages), and only **Deals** have pipeline stages.

## Changes Made

### 1. ✅ Deleted Incorrect Component
- **Deleted:** `MoveStageDialog.kt`
  - This was conceptually wrong - leads don't move through pipeline stages

### 2. ✅ Created New Component
- **Created:** `ChangeLeadStatusDialog.kt`
  - Allows changing lead status between: NEW, CONTACTED, QUALIFIED, UNQUALIFIED
  - Does NOT include CONVERTED (that's only done via conversion to deal)
  - Shows helpful tip when QUALIFIED status is selected
  - Uses proper status colors matching web implementation

### 3. ✅ Updated LeadCard.kt
**Changes:**
- Changed parameter from `onMove` to `onChangeStatus`
- Updated menu options:
  - ✅ Edit (kept)
  - ✅ **Change Status** (NEW - replaces "Move to Stage")
  - ✅ Convert to Deal (now only shows if status ≠ CONVERTED)
  - ✅ Delete (kept)
- Uses `Icons.Default.Cached` for the Change Status icon

### 4. ✅ Updated LeadsViewModel.kt
**Added:**
- `showChangeStatusDialog` StateFlow
- `showChangeStatusDialog(lead)` method
- `hideChangeStatusDialog()` method
- `changeLeadStatus(leadId, newStatus)` method - updates lead status via API

**Removed:**
- `showMoveStageDialog` StateFlow
- `showMoveStageDialog(lead)` method
- `hideMoveStageDialog()` method

### 5. ✅ Updated LeadsScreen.kt
**Changes:**
- Added `showChangeStatusDialog` state collection
- Updated `LeadCard` call to use `onChangeStatus` instead of `onMove`
- Added `ChangeLeadStatusDialog` rendering with proper callbacks

## Lead Status Flow (Correct Implementation)

```
NEW → CONTACTED → QUALIFIED → CONVERTED (to Deal)
  ↓                    ↓
  └──→ UNQUALIFIED ←──┘
```

### Status Definitions:
- **NEW**: Fresh lead, not yet contacted
- **CONTACTED**: Reached out to the lead
- **QUALIFIED**: Meets criteria for conversion (can convert to deal)
- **UNQUALIFIED**: Does not meet criteria
- **CONVERTED**: Successfully converted to a deal (automatic via conversion)

## API Endpoints Used

### Change Status:
```
PATCH /leads/{id}
Body: { "status": "QUALIFIED" }
```

### Convert to Deal:
```
POST /leads/{id}/convert
Body: {
  "pipelineId": "xxx",
  "stageId": "yyy",
  "probability": 75,
  "expectedCloseDate": "2025-12-31"
}
```
This automatically sets lead status to CONVERTED.

## Key Differences from Deals

| Feature | Leads | Deals |
|---------|-------|-------|
| Progress Tracking | **Statuses** (NEW, CONTACTED, etc.) | **Pipeline Stages** (customizable) |
| Movement | Change status via dropdown | Move through stages in pipeline |
| End State | CONVERTED → becomes Deal | WON or LOST |
| Pipeline Association | None | Always belongs to a pipeline |

## User Workflow

1. **Create Lead** → Status: NEW
2. **Contact Lead** → Change Status to CONTACTED
3. **Qualify Lead** → Change Status to QUALIFIED
4. **Convert to Deal** → Select pipeline & stage → Lead status → CONVERTED
5. Deal is now in the pipeline and can be moved through stages

## Files Modified

1. ✅ `Synapse/app/src/main/java/com/example/synapse/presentation/leads/components/ChangeLeadStatusDialog.kt` (NEW)
2. ✅ `Synapse/app/src/main/java/com/example/synapse/presentation/leads/components/LeadCard.kt`
3. ✅ `Synapse/app/src/main/java/com/example/synapse/presentation/leads/LeadsViewModel.kt`
4. ✅ `Synapse/app/src/main/java/com/example/synapse/presentation/leads/LeadsScreen.kt`

## Files Deleted

1. ✅ `Synapse/app/src/main/java/com/example/synapse/presentation/leads/components/MoveStageDialog.kt`

## Testing Checklist

- [ ] Create a new lead (should have status NEW)
- [ ] Change lead status to CONTACTED
- [ ] Change lead status to QUALIFIED
- [ ] Change lead status to UNQUALIFIED
- [ ] Convert QUALIFIED lead to deal (should auto-set to CONVERTED)
- [ ] Verify CONVERTED leads don't show "Convert to Deal" option
- [ ] Verify status colors match (NEW=blue, CONTACTED=purple, QUALIFIED=green, UNQUALIFIED=red, CONVERTED=green)

## Notes

- All changes follow the web implementation behavior
- No linter errors detected
- Maintains consistency with backend API
- Proper separation of concerns between Leads (statuses) and Deals (pipeline stages)

