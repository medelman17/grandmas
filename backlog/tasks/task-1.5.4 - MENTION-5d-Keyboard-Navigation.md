---
id: task-1.5.4
title: 'MENTION-5d: Keyboard Navigation'
status: To Do
assignee: []
created_date: '2026-01-18 01:41'
labels:
  - mention-system
  - ui
  - keyboard
milestone: '@Mentions Complete'
dependencies:
  - task-1.5.1
  - task-1.5.3
parent_task_id: task-1.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement keyboard event handling for navigating suggestions with arrow keys and selecting/dismissing with tab/enter/escape.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ArrowUp/ArrowDown navigate suggestions (wraps around)
- [ ] #2 Tab or Enter selects current suggestion
- [ ] #3 Escape closes dropdown without selecting
- [ ] #4 Keys only intercepted when autocomplete is open
- [ ] #5 Normal typing continues to work
<!-- AC:END -->
