<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18jBnnRlfJDIVE0Ch3VbE8RChX-Jiz2k9

## Run Locally

**Prerequisites:** Node.js


1. Install dependencies:
   `npm install`
2. Start the Go backend in [ai-assistant-go/README.md](../ai-assistant-go/README.md):
   `go run ./cmd/ai-assistant-server`
3. Set `AI_ASSISTANT_GO_BASE_URL` in `.env.local` if your Go service is not running on `http://127.0.0.1:18080`
4. Run the app:
   `npm run dev`

You can also use the workspace scripts:

- `./start-go-server.ps1`
- `./start-web-dev.ps1`
- `./start-dev.ps1`

## Backend Mapping

The frontend no longer calls Gemini or OpenAI-compatible model APIs directly for page features.

Current page-to-backend mapping:

- `GeminiChat` -> `/api/ai/text/chat`
- `GenAIImageStudio` -> `/api/ai/image/genai-studio`
- `Cmftransfer` -> `/api/ai/image/cmf`
- `AICameraDirector` -> `/api/ai/image/camera-director`
- `AILineArtColorizer` -> `/api/ai/image/line-art-colorizer`
- `StyleMorph` -> `/api/ai/image/stylemorph`
- `CinematicMultiShot` -> `/api/ai/image/cinematic-multi-shot`
- `GeminiProductAI` analysis -> `/api/ai/image/medical-styler/analyze`
- `GeminiProductAI` generation -> `/api/ai/image/medical-styler/generate`
- `VeoStudio` -> `/api/ai/video/generate`
