---
id: task-1.4
title: 'MENTION-4: Coordinator Mention Context'
status: Done
assignee: []
created_date: '2026-01-18 01:10'
updated_date: '2026-01-18 03:35'
labels:
  - mention-system
  - api
  - debate
milestone: '@Mentions Complete'
dependencies:
  - task-1.3
parent_task_id: task-1
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pass mention context to the debate coordinator so it can intelligently suggest non-mentioned grandmas join debates when appropriate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 checkForDebates() accepts optional mentionedGrandmas parameter
- [x] #2 API route passes mention context to coordinator prompt
- [x] #3 Coordinator can suggest non-mentioned grandmas join debates
<!-- AC:END -->
