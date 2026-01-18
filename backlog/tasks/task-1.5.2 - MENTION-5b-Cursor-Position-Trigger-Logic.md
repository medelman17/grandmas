---
id: task-1.5.2
title: 'MENTION-5b: Cursor Position & @ Trigger Logic'
status: Done
assignee: []
created_date: '2026-01-18 01:41'
updated_date: '2026-01-18 03:39'
labels:
  - mention-system
  - ui
  - logic
milestone: '@Mentions Complete'
dependencies:
  - task-1.5.1
parent_task_id: task-1.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement cursor position tracking and detection of @ character to trigger autocomplete opening with partial text extraction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Track cursor position via selectionStart
- [x] #2 Detect @ typed and open autocomplete
- [x] #3 Extract partial text after @ for filtering (e.g., '@abu' → 'abu')
- [x] #4 Close autocomplete if cursor moves before @
<!-- AC:END -->
