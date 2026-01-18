---
id: task-5.8
title: 'MEM-8: User ID Hook'
status: Done
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:23'
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
- [x] #1 useUserId() hook returns string | null
- [x] #2 Generates UUID on first visit
- [x] #3 Persists to localStorage
- [x] #4 Works with SSR (returns null initially, hydrates on client)
<!-- AC:END -->
