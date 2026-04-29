# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20260423-001] best_practice

**Logged**: 2026-04-23T00:00:00+08:00
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
Gemini 2.5 image preview endpoints should be rate-limited or serialized for batch generation in the UI.

### Details
The ai-line-art-colorizer page used Promise.allSettled to fire multiple gemini-2.5-flash-image requests at once. In practice, batch requests returned only one valid image while the rest failed with no image data. Switching the 2.5 path to sequential generation with a short pause stabilizes multi-image output while keeping Gemini 3 Pro behavior unchanged.

### Suggested Action
Audit other Gemini 2.5 image pages that still use Promise.allSettled for batch generation and apply the same sequential or low-concurrency strategy.

### Metadata
- Source: error
- Related Files: pages/ai-line-art-colorizer/index.tsx
- Tags: gemini, image-generation, concurrency

---
