---
id: task-5.9
title: 'MEM-9: API Memory Integration'
status: To Do
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:13'
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
- [ ] #1 userId accepted in request body
- [ ] #2 Memory tools created and passed to streamText
- [ ] #3 maxSteps: 3 allows tool loops for memory operations
- [ ] #4 Works gracefully without userId (tools omitted)
<!-- AC:END -->
