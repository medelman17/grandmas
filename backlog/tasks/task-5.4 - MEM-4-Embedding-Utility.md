---
id: task-5.4
title: 'MEM-4: Embedding Utility'
status: To Do
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:13'
labels:
  - memory-system
  - ai
  - embeddings
milestone: Memory System MVP
dependencies:
  - task-5.3
parent_task_id: task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create utility for generating text embeddings using OpenAI's text-embedding-3-small model.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Uses OpenAI text-embedding-3-small model
- [ ] #2 generateEmbedding(text) returns number[] of 1536 dimensions
- [ ] #3 generateEmbeddings(texts) for efficient batching
- [ ] #4 Proper error handling for API failures
<!-- AC:END -->
