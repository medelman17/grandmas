---
id: task-3.5.2
title: 'ALLY-5b: Timer Logic with Random Delays'
status: To Do
assignee: []
created_date: '2026-01-18 01:39'
labels:
  - alliances
  - hooks
milestone: Social Dynamics
dependencies:
  - task-3.5.1
parent_task_id: task-3.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement timer management for delayed message delivery with random 2-5 minute delays.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 scheduleDelivery() sets setTimeout with random 2-5 min delay
- [ ] #2 Timer refs tracked for cleanup on unmount
- [ ] #3 onDeliver callback fires when timer completes
- [ ] #4 cancelPending() cancels all active timers
<!-- AC:END -->
