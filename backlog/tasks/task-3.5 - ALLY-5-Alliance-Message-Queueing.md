---
id: task-3.5
title: 'ALLY-5: Alliance Message Queueing'
status: To Do
assignee: []
created_date: '2026-01-18 01:11'
updated_date: '2026-01-18 01:13'
labels:
  - alliances
  - hooks
milestone: Social Dynamics
dependencies:
  - task-3.2
  - task-3.4
parent_task_id: task-3
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add delayed delivery logic for alliance messages with 2-5 minute random delays, probability triggers, and rate limiting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alliance messages queued for 2-5 min delayed delivery
- [ ] #2 40% probability trigger after debates
- [ ] #3 Daily limit respected
- [ ] #4 Same-target cooldown prevents spam
<!-- AC:END -->
