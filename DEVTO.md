# SlothSpace: a slower, more private kind of productivity

> Draft DEV.to submission for Hacktoberfest Week 3 — **Slow and Steady**

Productivity software often asks us to move faster: connect every service, upload every note, and send every thought to an API. SlothSpace starts from a different question: what if a productivity dashboard helped us make less noise?

SlothSpace is a small wind-down dashboard built around three quiet rituals: choose one task, settle into an ambient sound, and clear a little digital clutter. It uses a midnight/twilight palette, a guided breathing loop, and a deliberately tiny interface. There are no neon badges or infinite feeds.

The interesting part is what does **not** happen. SlothSpace’s brown noise and soft rain are synthesized in the browser with the Web Audio API. The Lazy Inbox accepts files with the browser File API; the files remain local and disappear when the session ends. The reflection demo turns a note into a next step without sending the note to a server.

## Why local inference matters

The next step is to connect the reflection panel to an open-weight model. Users can run Gemma or Llama through Ollama on their own machine, or load a WebLLM-compatible model directly in a WebGPU-capable browser.

That architecture changes the relationship between a person and their productivity tool:

- **Private by default:** personal notes and file names do not need to leave the device.
- **Zero API costs:** there is no per-token bill for a quiet evening planning session.
- **Resilient:** after a model is downloaded, browser inference can work without the internet.
- **Open innovation:** contributors can inspect, fork, tune, or replace every part of the stack.

Local does not mean magic. A browser model may need a capable GPU, and the first WebLLM download requires a connection. Ollama is a practical alternative for development. The important design decision is that the network boundary is visible and optional, rather than assumed.

## Built for “Slow and Steady”

Hacktoberfest is a great excuse to build features. Week 3 is also a good excuse to question feature velocity. SlothSpace treats restraint as a feature: fewer dependencies, no required backend, no analytics, and a UI that gives a user permission to take one small step.

To try it, run `python -m http.server 8080` in the project directory and open `http://localhost:8080`. The app is plain HTML, CSS, and JavaScript on purpose. It is easy to understand, easy to fork, and ready for contributions around accessibility, local model adapters, better file categorization, and more gentle rituals.

Slow and steady is not the absence of ambition. It is choosing where to place attention.
