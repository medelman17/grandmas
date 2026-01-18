---
id: task-5.9
title: 'MEM-9: API Memory Integration'
status: Done
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:23'
labels:
  - memory-system
  - api
milestone: Memory System MVP
dependencies:
  - task-5.6
  - task-5.7
parent_task_id: task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the chat API route to include userId handling and memory tools for grandma responses.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 userId accepted in request body
- [x] #2 Memory tools created and passed to streamText
- [x] #3 maxSteps: 3 allows tool loops for memory operations
- [x] #4 Works gracefully without userId (tools omitted)
<!-- AC:END -->
