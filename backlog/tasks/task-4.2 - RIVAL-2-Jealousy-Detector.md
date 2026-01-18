---
id: task-4.2
title: 'RIVAL-2: Jealousy Detector'
status: To Do
assignee: []
created_date: '2026-01-18 01:11'
updated_date: '2026-01-18 01:13'
labels:
  - rivalries
  - logic
milestone: Social Dynamics
dependencies:
  - task-4.1
parent_task_id: task-4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create logic to detect when grandmas should get jealous based on engagement imbalance and time since last contact.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 JealousyTrigger interface with intensity levels (mild, moderate, dramatic)
- [ ] #2 checkForJealousy() compares engagement scores across grandmas
- [ ] #3 Triggers when ratio > 3x and > 2 days no contact
- [ ] #4 Intensity based on imbalance ratio
<!-- AC:END -->
