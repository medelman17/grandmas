---
id: task-1.1
title: 'MENTION-1: Type System Updates for Mentions'
status: To Do
assignee: []
created_date: '2026-01-18 01:10'
labels:
  - mention-system
  - types
milestone: '@Mentions Complete'
dependencies: []
parent_task_id: task-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add mention tracking fields to core types to support the @mention feature throughout the application.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 mentionedGrandmas?: GrandmaId[] added to CounselMessage interface
- [ ] #2 mentionedGrandmas?: GrandmaId[] added to ChatRequest.context
- [ ] #3 TypeScript compiles without errors
<!-- AC:END -->
