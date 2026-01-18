---
id: task-1.5.5
title: 'MENTION-5e: Selection & Text Insertion'
status: To Do
assignee: []
created_date: '2026-01-18 01:41'
labels:
  - mention-system
  - ui
  - logic
milestone: '@Mentions Complete'
dependencies:
  - task-1.5.2
  - task-1.5.4
parent_task_id: task-1.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Handle selection of a grandma suggestion and insert the complete @mention at the correct cursor position, replacing partial text.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Click on suggestion triggers selection
- [ ] #2 Selection replaces @partial with @grandma-id + space
- [ ] #3 Cursor positioned after inserted mention
- [ ] #4 Input retains focus after selection
- [ ] #5 Works for mentions mid-text, not just at end
<!-- AC:END -->
