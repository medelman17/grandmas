---
id: task-1.1
title: 'MENTION-1: Type System Updates for Mentions'
status: Done
assignee: []
created_date: '2026-01-18 01:10'
updated_date: '2026-01-18 02:26'
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
- [x] #1 mentionedGrandmas?: GrandmaId[] added to CounselMessage interface
- [x] #2 mentionedGrandmas?: GrandmaId[] added to ChatRequest.context
- [x] #3 TypeScript compiles without errors
<!-- AC:END -->
