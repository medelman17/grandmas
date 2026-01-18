---
id: task-6
title: Testing & Quality
status: To Do
assignee: []
created_date: '2026-01-18 01:09'
updated_date: '2026-01-18 01:13'
labels:
  - testing
  - quality
milestone: Full Test Coverage
dependencies:
  - task-1
  - task-2
  - task-3
  - task-4
  - task-5
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create comprehensive test suites for all new features including @mentions, private messaging, social dynamics, and memory system. Set up E2E testing with Playwright.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 @mention parsing and display tests pass (13 scenarios)
- [ ] #2 Private messaging tests pass (22 scenarios)
- [ ] #3 Social dynamics tests cover alliances and rivalries
- [ ] #4 Memory system has unit and integration tests
- [ ] #5 Playwright E2E tests run in CI
- [ ] #6 All test suites pass on npm test
<!-- AC:END -->
