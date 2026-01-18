---
id: task-5.5
title: 'MEM-5: Memory Store'
status: To Do
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:13'
labels:
  - memory-system
  - database
  - store
milestone: Memory System MVP
dependencies:
  - task-5.4
parent_task_id: task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the memory store with CRUD operations and vector similarity search using pgvector.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 search() uses cosine similarity with pgvector
- [ ] #2 create() generates and stores embedding
- [ ] #3 delete() and getAll() for memory management
- [ ] #4 getStats() returns per-grandma memory counts
- [ ] #5 Results include relative time strings ('2 days ago')
<!-- AC:END -->
