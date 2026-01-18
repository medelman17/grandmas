---
id: task-4.5
title: 'RIVAL-5: Jealousy Check Integration'
status: To Do
assignee: []
created_date: '2026-01-18 01:11'
updated_date: '2026-01-18 01:13'
labels:
  - rivalries
  - hooks
milestone: Social Dynamics
dependencies:
  - task-4.2
  - task-4.4
parent_task_id: task-4
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add periodic jealousy checks to the private messages hook with probability-based triggers and rate limiting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Check runs on hook mount and every 60 seconds
- [ ] #2 30-60% probability based on intensity level
- [ ] #3 48-hour cooldown per grandma
- [ ] #4 Weekly limit of 3 jealousy messages
<!-- AC:END -->
