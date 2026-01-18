---
id: task-5.8
title: 'MEM-8: User ID Hook'
status: To Do
assignee: []
created_date: '2026-01-18 01:12'
labels:
  - memory-system
  - hooks
  - client
milestone: Memory System MVP
dependencies: []
parent_task_id: task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create client-side hook for managing anonymous user UUID with localStorage persistence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 useUserId() hook returns string | null
- [ ] #2 Generates UUID on first visit
- [ ] #3 Persists to localStorage
- [ ] #4 Works with SSR (returns null initially, hydrates on client)
<!-- AC:END -->
