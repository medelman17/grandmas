---
id: task-3.5.3
title: 'ALLY-5c: Probability Gate & Daily Limit'
status: Done
assignee: []
created_date: '2026-01-18 01:39'
updated_date: '2026-01-18 02:25'
labels:
  - alliances
  - hooks
milestone: Social Dynamics
dependencies:
  - task-3.5.1
parent_task_id: task-3.5
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add probability filtering (40%) and daily limit tracking to prevent gossip spam.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 shouldTrigger() applies 40% probability gate
- [ ] #2 dailyCount state tracks messages sent today
- [ ] #3 Resets at midnight or uses date comparison
- [ ] #4 Respects ALLIANCE_CONFIG.dailyLimit
<!-- AC:END -->
