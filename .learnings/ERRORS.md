# Errors

Command failures and integration errors.

---

## [ERR-20260423-001] gemini-preview-concurrency

**Logged**: 2026-04-23T00:00:00+08:00
**Priority**: high
**Status**: pending
**Area**: frontend

### Summary
Gemini 2.5 image preview requests failed when ai-line-art-colorizer submitted 4 concurrent generations.

### Error
```text
Request failed: Error: gemini preview returned no image data
```

### Context
- Operation: ai-line-art-colorizer multi-image generation
- Model: gemini-2.5-flash-image
- Symptom: when imageCount=4, only one request usually succeeded and the others returned no image data

### Suggested Fix
Run Gemini 2.5 multi-image requests sequentially with a short delay instead of Promise.allSettled over fully concurrent requests.

### Metadata
- Reproducible: yes
- Related Files: pages/ai-line-art-colorizer/index.tsx

---
