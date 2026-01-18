---
id: task-5.7
title: 'MEM-7: User Identity Store'
status: To Do
assignee: []
created_date: '2026-01-18 01:12'
labels:
  - memory-system
  - database
  - users
milestone: Memory System MVP
dependencies: []
parent_task_id: task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create server-side user record management for anonymous users to associate memories with.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 getOrCreate(userId) upserts user record
- [ ] #2 Updates last_seen_at timestamp on activity
- [ ] #3 exists(userId) check for validation
<!-- AC:END -->
