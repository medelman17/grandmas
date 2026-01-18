---
id: task-3.5.5
title: 'ALLY-5e: Wire Queue into Post-Debate Flow'
status: To Do
assignee: []
created_date: '2026-01-18 01:39'
labels:
  - alliances
  - integration
milestone: Social Dynamics
dependencies:
  - task-3.5.1
  - task-3.5.2
  - task-3.5.3
  - task-3.5.4
parent_task_id: task-3.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Integrate the alliance queue with useCounsel to trigger gossip checks after debates complete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 useCounsel accepts onAllianceTrigger callback
- [ ] #2 Called after runAutomaticDebates completes
- [ ] #3 Passes debate context for trigger detection
- [ ] #4 CounselChat wires queue delivery to triggerProactiveMessage
<!-- AC:END -->
