---
id: task-5
title: Memory System
status: Done
assignee: []
created_date: '2026-01-18 01:09'
updated_date: '2026-01-18 01:24'
labels:
  - feature
  - database
  - ai
milestone: Memory System MVP
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement persistent memory allowing grandmas to remember facts about users across sessions. Uses pgvector for semantic search of memories, with each grandma having personality-specific memory behaviors.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Postgres database with pgvector stores user memories
- [x] #2 Memories searchable via semantic similarity
- [x] #3 AI SDK tools allow grandmas to search and create memories
- [x] #4 Each grandma has unique memory behavior matching personality
- [x] #5 Anonymous user identity managed via localStorage UUID
- [x] #6 Memory activity indicator shows when grandmas access memories
- [x] #7 Memories scoped per user-grandma pair
<!-- AC:END -->
