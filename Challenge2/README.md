# Outside In

An offline-first activity guide that makes the screen the shortest part of the experience. Pick a place, a time, and an energy level; Outside In suggests a small indoor or outdoor reset, explains a general wellbeing benefit, and starts a phone-down session.

## Run it

Requirements: Node.js 18 or newer. No npm install or build step is needed.

```powershell
npm start
```

Open <http://localhost:4173>. The app shell, activity library, and progress tracker work without internet after the first local visit. Progress stays in browser storage on this device. There is no account, analytics, cloud sync, or remote API.

## Optional local AI

Outside In can use any model installed in [Ollama](https://ollama.com/) to personalize an activity choice. Ollama runs on this computer; the app only sends the selected setting, time, energy, and its bundled activity options to `127.0.0.1`. It does not send personal details or contact a hosted model.

Install Ollama and download a small open-weight model while online, for example:

```powershell
ollama pull qwen3:0.6b
```

Start Ollama, then reload Outside In. The app discovers installed model names automatically. Once the model is downloaded, Ollama inference and Outside In's core activity flow can run without internet. Model downloads are not included or triggered by this project. Model speed depends on the computer's available memory and processor.

Without Ollama or a local model, the bundled offline picker still works. It chooses only from activities matching the selected preferences; it does not pretend a language model ran.

## Offline behavior

- The service worker precaches the complete app shell and icon on the first visit.
- Activities and benefit notes are bundled with the app; recommendations do not require a network.
- Session time and progress are stored locally. No information is synchronized.
- `/api/*` is deliberately excluded from the service-worker cache. Local AI becomes unavailable if Ollama is stopped, but the offline picker remains usable.
- The first visit and an optional model download require internet; use the app once before going offline.

## Health notes

Benefit descriptions are general and intentionally modest. They are not medical advice or a promise of a specific outcome. See the [CDC overview of physical activity benefits](https://www.cdc.gov/physical-activity-basics/health-benefits/index.html).

## Open innovation

The activity library and interface are usable without a server account or subscription. Open-weight models can be downloaded once, run locally, and swapped without changing the activity catalog. The model proposes an activity ID and a short nudge; the app validates the ID against its bundled list, so it cannot invent the selected activity. That trade gives people privacy and offline access, while accepting that a small local model can be slower or less capable than a hosted frontier model.

## Challenge entry

This project is built for the [Hacktoberfest Open-Source AI Challenge: Week 1 - Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05). A DEV submission needs the challenge template and the `devchallenge` and `hf26challenge` tags. Add a real demo or recording and your own outside test notes before publishing.

## Sources

- CDC, [Health Benefits of Physical Activity](https://www.cdc.gov/physical-activity-basics/health-benefits/index.html)
- Ollama, [Chat API](https://docs.ollama.com/api/chat)
- DEV Community, [Running Local LLMs With Ollama For Private Development](https://dev.to/nazar-boyko/running-local-llms-with-ollama-for-private-development-4924)
- DEV Community, [Offline PWA: the pitfalls of an app that never asks for the network](https://dev.to/ohugonnot/offline-pwa-the-pitfalls-of-an-app-that-never-asks-for-the-network-fc7)

## License

MIT. See [LICENSE](LICENSE).