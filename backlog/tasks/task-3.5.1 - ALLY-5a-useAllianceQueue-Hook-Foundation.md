---
id: task-3.5.1
title: 'ALLY-5a: useAllianceQueue Hook Foundation'
status: To Do
assignee: []
created_date: '2026-01-18 01:39'
labels:
  - alliances
  - hooks
milestone: Social Dynamics
dependencies: []
parent_task_id: task-3.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the useAllianceQueue hook with in-memory queue state for managing pending alliance gossip messages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QueuedAllianceMessage interface with id, fromGrandma, aboutGrandma, trigger, scheduledFor
- [ ] #2 useAllianceQueue hook with queue state array
- [ ] #3 addToQueue() and removeFromQueue() methods
- [ ] #4 getQueuedMessages() for inspection
<!-- AC:END -->
