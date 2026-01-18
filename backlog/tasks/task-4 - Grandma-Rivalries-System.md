---
id: task-4
title: Grandma Rivalries System
status: To Do
assignee: []
created_date: '2026-01-18 01:09'
updated_date: '2026-01-18 01:13'
labels:
  - feature
  - social-dynamics
milestone: Social Dynamics
dependencies:
  - task-2
  - task-3
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement jealousy mechanics where neglected grandmas notice when users favor other grandmas and reach out with guilt-trippy messages. Based on engagement tracking and imbalance detection.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 User engagement tracked per grandma with localStorage persistence
- [ ] #2 Jealousy triggers when engagement ratio > 3x and > 2 days no contact
- [ ] #3 Each grandma has personality-specific jealousy expressions (mild/moderate/dramatic)
- [ ] #4 Jealousy messages show 'Missed you' indicator
- [ ] #5 48-hour cooldown and weekly limits prevent spam
- [ ] #6 Messages are guilt-trippy but not mean
<!-- AC:END -->
