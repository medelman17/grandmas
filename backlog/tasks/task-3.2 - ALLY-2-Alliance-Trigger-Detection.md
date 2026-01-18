---
id: task-3.2
title: 'ALLY-2: Alliance Trigger Detection'
status: Done
assignee: []
created_date: '2026-01-18 01:11'
updated_date: '2026-01-18 01:46'
labels:
  - alliances
  - logic
milestone: Social Dynamics
dependencies:
  - task-3.1
parent_task_id: task-3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create logic to detect when grandmas should gossip based on debate history, being outnumbered, harsh criticism, or random chance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AllianceTrigger interface defined with triggerType, fromGrandma, toGrandma, context
- [ ] #2 checkForAllianceTrigger() analyzes debate history
- [ ] #3 Detects post-debate, outnumbered, harsh-criticism, random triggers
- [ ] #4 Returns null if no trigger appropriate
<!-- AC:END -->
