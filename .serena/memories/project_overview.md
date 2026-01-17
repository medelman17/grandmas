# Counsel of Grandmas - Project Overview

## Purpose
**Counsel of Grandmas** is a multi-agent AI chat application where 5 AI grandma personas respond in parallel to user questions, with the ability to debate each other when they disagree.

## Tech Stack
- **Framework**: Next.js 16+ (App Router, Edge Runtime)
- **UI**: React 19, Tailwind CSS v4, Framer Motion
- **AI**: Vercel AI SDK v6+ with AI Gateway, Anthropic models
- **Language**: TypeScript (strict mode)

## The 5 Grandmas
| ID | Name | Personality |
|----|------|-------------|
| `nana-ruth` | Nana Ruth | Brooklyn teacher, literary references |
| `abuela-carmen` | Abuela Carmen | Mexico City chef, food metaphors |
| `ba-nguyen` | Bà Nguyen | Saigon survivor, stoic brevity |
| `grandma-edith` | Grandma Edith | Minnesota organist, passive-aggressive |
| `bibi-amara` | Bibi Amara | Lagos businesswoman, strategic |

## Key Features
- Parallel streaming responses from all 5 grandmas
- Automatic debate detection and multi-round debates
- iMessage-style message appearance
- Personality-based typing delays
- Meeting summary generation
