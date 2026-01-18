---
id: task-5.11
title: 'MEM-11: Client Memory Integration'
status: Done
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:23'
labels:
  - memory-system
  - hooks
  - integration
milestone: Memory System MVP
dependencies:
  - task-5.8
  - task-5.9
parent_task_id: task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update client-side hooks and components to pass userId to API for memory-enabled conversations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 useCounsel accepts userId parameter
- [x] #2 streamGrandmaResponse includes userId in request
- [x] #3 Page component uses useUserId hook and passes to useCounsel
<!-- AC:END -->
