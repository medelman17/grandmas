---
id: task-1.3
title: 'MENTION-3: Hook Changes for Mention Filtering'
status: Done
assignee: []
created_date: '2026-01-18 01:10'
updated_date: '2026-01-18 03:32'
labels:
  - mention-system
  - hooks
milestone: '@Mentions Complete'
dependencies:
  - task-1.2
parent_task_id: task-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update sendQuestion in use-counsel.ts to parse mentions and filter which grandmas respond initially.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 sendQuestion calls parseMentions() on input
- [x] #2 Only mentioned grandmas respond if mentions present
- [x] #3 All 5 grandmas respond if no mentions (current behavior preserved)
- [x] #4 User message includes mentionedGrandmas metadata
<!-- AC:END -->
