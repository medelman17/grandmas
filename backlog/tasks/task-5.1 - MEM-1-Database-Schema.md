---
id: task-5.1
title: 'MEM-1: Database Schema'
status: Done
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:23'
labels:
  - memory-system
  - database
milestone: Memory System MVP
dependencies: []
parent_task_id: task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the Postgres schema with pgvector extension for storing user memories with vector embeddings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 users table with UUID primary key and timestamps
- [x] #2 memories table with content, category, importance, embedding vector(1536)
- [x] #3 conversations and messages tables for persistence
- [x] #4 Proper indexes for vector search and filtering
- [x] #5 Category and grandma_id constraints enforced
<!-- AC:END -->
