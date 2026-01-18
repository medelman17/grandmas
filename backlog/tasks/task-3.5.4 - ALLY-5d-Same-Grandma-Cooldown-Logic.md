---
id: task-3.5.4
title: 'ALLY-5d: Same-Grandma Cooldown Logic'
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
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prevent the same grandma from sending multiple gossip messages in quick succession.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 lastGossipTime tracked per grandma
- [ ] #2 isOnCooldown(grandmaId) checks against ALLIANCE_CONFIG.cooldown
- [ ] #3 Cooldown of ~30 minutes between gossip from same grandma
<!-- AC:END -->
