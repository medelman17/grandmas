---
id: task-2.4
title: 'PM-7: API Proactive-Check Mode'
status: Done
assignee: []
created_date: '2026-01-18 01:10'
updated_date: '2026-01-18 01:34'
labels:
  - private-messaging
  - api
milestone: Private Chat Complete
dependencies:
  - task-2.3
parent_task_id: task-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add proactive-check mode to the chat API that analyzes if a grandma should reach out privately based on conversation context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 mode: 'proactive-check' handled in chat route
- [ ] #2 Analyzes if grandma should reach out privately
- [ ] #3 Returns JSON with shouldReach and reason fields
- [ ] #4 Uses appropriate prompt for selectivity (~20% rate)
<!-- AC:END -->
