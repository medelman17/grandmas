---
id: task-1
title: '@Mention System'
status: Done
assignee: []
created_date: '2026-01-18 01:09'
updated_date: '2026-01-18 05:34'
labels:
  - feature
  - ui
  - core
milestone: '@Mentions Complete'
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement @mention functionality allowing users to direct questions to specific grandmas. When a user @mentions one or more grandmas, only those grandmas should respond initially. The autocomplete UI should make it easy to discover and use mentions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Users can type @ to trigger autocomplete with grandma suggestions
- [ ] #2 Selecting a mention inserts @grandma-id into input
- [ ] #3 Only mentioned grandmas respond to questions with mentions
- [ ] #4 All grandmas respond when no mentions present (current behavior)
- [ ] #5 @mentions display as styled badges in user messages
- [ ] #6 Debate coordinator can suggest non-mentioned grandmas join debates
<!-- AC:END -->
