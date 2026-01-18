---
id: task-1.3
title: 'MENTION-3: Hook Changes for Mention Filtering'
status: To Do
assignee: []
created_date: '2026-01-18 01:10'
updated_date: '2026-01-18 01:13'
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
- [ ] #1 sendQuestion calls parseMentions() on input
- [ ] #2 Only mentioned grandmas respond if mentions present
- [ ] #3 All 5 grandmas respond if no mentions (current behavior preserved)
- [ ] #4 User message includes mentionedGrandmas metadata
<!-- AC:END -->
