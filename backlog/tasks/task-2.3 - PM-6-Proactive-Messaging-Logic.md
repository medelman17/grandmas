---
id: task-2.3
title: 'PM-6: Proactive Messaging Logic'
status: Done
assignee: []
created_date: '2026-01-18 01:10'
updated_date: '2026-01-18 01:34'
labels:
  - private-messaging
  - hooks
  - ai
milestone: Private Chat Complete
dependencies: []
parent_task_id: task-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add logic for grandmas to proactively initiate private messages based on context from group chat debates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 checkForProactiveMessage() function created in use-counsel.ts
- [ ] #2 Called after debate responses complete
- [ ] #3 Returns { shouldReach: boolean, reason: string }
- [ ] #4 ~20% trigger rate for appropriate contexts
<!-- AC:END -->
