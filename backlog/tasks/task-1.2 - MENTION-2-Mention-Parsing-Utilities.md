---
id: task-1.2
title: 'MENTION-2: Mention Parsing Utilities'
status: To Do
assignee: []
created_date: '2026-01-18 01:10'
updated_date: '2026-01-18 01:13'
labels:
  - mention-system
  - utilities
milestone: '@Mentions Complete'
dependencies:
  - task-1.1
parent_task_id: task-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create utilities for parsing @mentions from text and filtering grandmas for autocomplete suggestions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 MENTION_PATTERN regex matches all 5 grandma IDs case-insensitively
- [ ] #2 parseMentions(text) returns unique GrandmaId array
- [ ] #3 getPartialMention(text, cursor) detects incomplete mentions for autocomplete
- [ ] #4 filterGrandmasByPartial(partial) filters grandmas by ID or name match
<!-- AC:END -->
