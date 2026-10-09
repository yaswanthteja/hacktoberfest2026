---
title: "Outside In: Local AI for More Life Away From Your Phone"
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

## What I Built

I built **Outside In**, an offline-first activity guide for anyone who wants a gentle nudge away from scrolling and toward something they can do in the real world. Pick inside or outside, how much time you have, and your energy level. The app suggests a short activity, explains a modest general wellbeing benefit, and offers a phone-down timer.

Activities range from listening for birds or tending a plant to making a snack or taking a short walk. The app does not block other apps or treat screen time as a moral failing. It makes the next offline choice easy, then gets out of the way. Completed sessions are counted on the device, not sent to an account or server.

## Demo

**Local demo:** Run `npm start` and open <http://localhost:4173>. Visit once before disconnecting; the app shell is then cached for offline use.

**Public demo/video:** [Add a public demo URL or short recording before publishing.] I have not deployed a public instance or recorded an outside test yet.

## Code

**Repository:** [Add the public GitHub repository URL before publishing.]

The source is currently in this workspace. It uses Node's built-in server and browser APIs, with no npm dependencies or build step.

## How I Built It

The app is a small installable PWA. Its activity catalog, interface, icon, and service worker are local files; the service worker precaches the app shell, and the browser stores progress locally. The activity flow does not depend on a network connection after the first visit.

For personalized recommendations, I added an Ollama integration that runs an open-weight model on the same computer. The model receives only the selected setting, available time, energy level, and the matching bundled activity options. It returns an activity ID and a short nudge. The server checks that the ID belongs to the supplied options before showing the result. No cloud model, account, or hosted AI API is involved.

If Ollama is stopped or no model is installed, the offline guide still chooses a matching activity from the bundled catalog. That fallback keeps the app useful, but it is clearly labeled as the offline picker rather than pretending a model ran.

**Model test status:** Ollama is installed on my development machine, but no model had been downloaded when I tested this draft. The browser flow and fallback worked; I still need to download a model, verify local inference, and test that inference with the internet disconnected before claiming that full AI path as field-tested. To try it, install Ollama and pull a small model such as `qwen3:0.6b` while online, then reload the app. The model is downloaded separately and is not bundled with this repository.

## Why Does Open Innovation Matter?

The point of this app is to work when someone is ready to step away, including places where mobile signal is weak or absent. An open-weight model can be downloaded once and run on the user's own computer. Their preferences and activity choices stay local, and they can change the model without changing the activity library or handing those choices to a hosted API.

This also makes the tradeoff visible. Local inference can be slower and depends on the user's hardware; the first model download needs internet and storage. The fallback keeps the activity guide available without that model, while the local model adds personalized selection and language without a per-request cloud bill or a data transfer to a model provider.

Physical activity benefits vary from person to person. The app keeps its health notes general, avoids promises about specific outcomes, and links to the [CDC overview of physical activity benefits](https://www.cdc.gov/physical-activity-basics/health-benefits/index.html). They are not medical advice.

## My Agent Session

No public agent-session link is available for this build yet. This section can be removed or updated if I save and publish a session transcript.

## Prize Categories

No partner prize category is claimed. The project currently focuses on the overall open-source AI challenge; it does not use a partner's technology.

## Notes Before Publishing

- Replace the public demo and repository placeholders with working links.
- Pull and test the local model, including an offline run, before describing model inference as verified.
- If possible, take the app outside and add what happened to the demo or post.
- This draft was prepared with AI assistance; select the appropriate DEV AI disclosure when publishing.