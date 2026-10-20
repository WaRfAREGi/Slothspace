# SlothSpace

SlothSpace is a minimalist, offline-first productivity and wind-down dashboard for Hacktoberfest Week 3: **Slow and Steady**. It is intentionally a zero-build static site, so it can be opened from a local folder or served by any simple static server.

## Run it

```bash
python -m http.server 8080
```

Open `http://localhost:8080`. A local server is recommended because module scripts are restricted by some browsers when opened with `file://`.

## Included

- Soft midnight/twilight dashboard with a one-task focus loop and guided breathing.
- Brown noise and soft rain synthesized with the Web Audio API. No audio assets or network connection are required.
- Local drag-and-drop inbox. File objects stay in memory in the browser; they are never uploaded.
- Browser-only reflection demo that extracts a short next step from entered text.

If the sound button does not produce audio, click it once after loading the page (audio requires a user gesture), check the browser tab is not muted, and check the system output device. The control now reports unsupported Web Audio environments or other playback errors below the sound controls.

## Local AI setup

The demo response in `app.js` is deterministic and does not call an AI service. To connect an open-weight model, choose either path below.

### Ollama local connection

1. Install [Ollama](https://ollama.com) and run `ollama pull gemma3:4b` or `ollama pull llama3.2`.
2. Start Ollama (`ollama serve` if it is not already running).
3. Open the **Private thinking** card, leave the endpoint as `http://127.0.0.1:11434`, and click **Connect**. SlothSpace calls Ollama's local `/api/tags` endpoint and lists installed models.
4. Select a model, enter a note, and submit it. SlothSpace sends the prompt to Ollama's local `/api/chat` endpoint. If Ollama is unavailable, it falls back to the browser-only reflection demo.

If the browser blocks the request, start Ollama with the local app origin allowed:

```cmd
set OLLAMA_ORIGINS=http://127.0.0.1:8080
ollama serve
```

The integration uses no hosted APIs, API keys, or SlothSpace accounts. Keep Ollama bound to localhost.

The underlying request shape is:

```js
const response = await fetch("http://127.0.0.1:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gemma3:4b",
    stream: false,
    messages: [{ role: "user", content: `Give one gentle next step for: ${text}` }]
  })
});
const data = await response.json();
document.querySelector("#ai-response").textContent = data.message.content;
```

### WebLLM (fully in-browser)

WebLLM downloads a compatible open-weight model once and runs it through WebGPU. Install `@mlc-ai/web-llm`, create a `MLCEngine`, and load a model such as `Llama-3.2-3B-Instruct-q4f16_1-MLC`. Then call `engine.chat.completions.create(...)` from the existing `#ai-submit` handler. The model cache makes later runs possible without internet, but the first model download does need connectivity. See the WebLLM documentation for the current model registry and browser support.

## Local text-file reading

The browser File API reads only the file the user explicitly selects. Nothing is transmitted:

```js
fileInput.addEventListener("change", async ({ target }) => {
  const file = target.files[0];
  if (!file) return;
  const text = await file.text(); // local read, no upload
  const nextStep = localReflection(text);
  response.textContent = nextStep;
});
```

Use this pattern for `.txt`, `.md`, or small note files. For sensitive workflows, keep the extracted text in memory and clear it after the local model finishes.
