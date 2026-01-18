---
id: task-5.4
title: 'MEM-4: Embedding Utility'
status: Done
assignee: []
created_date: '2026-01-18 01:12'
updated_date: '2026-01-18 01:23'
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
- [x] #1 Uses OpenAI text-embedding-3-small model
- [x] #2 generateEmbedding(text) returns number[] of 1536 dimensions
- [x] #3 generateEmbeddings(texts) for efficient batching
- [x] #4 Proper error handling for API failures
<!-- AC:END -->
