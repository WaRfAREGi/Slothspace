const $ = (selector) => document.querySelector(selector);

const routeNames = ["focus", "reset", "atmosphere", "inbox", "copilot"];
const welcomePage = $("#welcome-page");
const dashboardHero = $(".dashboard-hero");
const dashboardGrid = $(".dashboard-grid");
const footer = $(".footer");
const routeNav = $(".route-nav");
const route = () => {
  const requested = window.location.hash.slice(1);
  const page = routeNames.includes(requested) ? requested : "";
  const isWelcome = !page;
  welcomePage.hidden = !isWelcome;
  dashboardHero.classList.toggle("visible", !isWelcome);
  dashboardGrid.classList.toggle("visible", !isWelcome);
  dashboardGrid.classList.toggle("route-view", !isWelcome);
  footer.classList.toggle("visible", !isWelcome);
  routeNav.classList.toggle("visible", !isWelcome);
  document.querySelectorAll(".dashboard-grid .card").forEach((card) => card.classList.toggle("active", card.dataset.page === page));
  document.querySelectorAll("[data-route]").forEach((link) => link.classList.toggle("active", link.dataset.route === page));
  document.title = isWelcome ? "SlothSpace — Slow and steady" : `SlothSpace — ${page}`;
};
window.addEventListener("hashchange", route);
route();

const clock = $("#current-time");
const updateClock = () => {
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
updateClock();
setInterval(updateClock, 30_000);

let taskDone = false;
const tasks = ["Choose one small thing to finish", "Clear five files from your desktop", "Write down the next tiny step", "Take ten unhurried minutes"];
let taskIndex = 0;
$("#task-check").addEventListener("click", () => {
  taskDone = !taskDone;
  $("#task-check").classList.toggle("done", taskDone);
  $("#task-title").classList.toggle("done", taskDone);
  $("#focus-progress").style.width = taskDone ? "100%" : "0";
  $("#focus-status").textContent = taskDone ? "1 of 1 complete" : "0 of 1 complete";
});
$("#change-task").addEventListener("click", () => {
  taskIndex = (taskIndex + 1) % tasks.length;
  taskDone = false;
  $("#task-title").textContent = tasks[taskIndex];
  $("#task-title").classList.remove("done");
  $("#task-check").classList.remove("done");
  $("#focus-progress").style.width = "0";
  $("#focus-status").textContent = "0 of 1 complete";
});

let breathingTimer;
let breathingActive = false;
let breathPhase = 0;
const phases = [["Breathe in", 4], ["Hold", 2], ["Breathe out", 6], ["Rest", 2]];
const runBreath = () => {
  const [label, seconds] = phases[breathPhase];
  $("#breathing-label").textContent = label;
  $("#breathing-count").textContent = seconds;
  $("#breathing-circle").classList.toggle("active", label === "Breathe in" || label === "Hold");
  let remaining = seconds;
  clearInterval(breathingTimer);
  breathingTimer = setInterval(() => {
    remaining -= 1;
    $("#breathing-count").textContent = remaining;
    if (remaining <= 0) { breathPhase = (breathPhase + 1) % phases.length; runBreath(); }
  }, 1000);
};
$("#breathing-toggle").addEventListener("click", () => {
  breathingActive = !breathingActive;
  if (breathingActive) { breathPhase = 0; runBreath(); $("#breathing-toggle").innerHTML = "Pause breathing <span>Ⅱ</span>"; }
  else { clearInterval(breathingTimer); $("#breathing-label").textContent = "Breathe in"; $("#breathing-count").textContent = "4"; $("#breathing-circle").classList.remove("active"); $("#breathing-toggle").innerHTML = "Start breathing <span>→</span>"; }
});

let audioContext;
let soundSource;
let soundGain;
let soundType = "brown";
let soundPlaying = false;
const setSoundStatus = (message) => { $("#sound-status").textContent = message; };
const stopNoise = () => {
  if (!soundSource) return;
  soundSource.stop();
  soundSource.disconnect();
  soundSource = null;
};
const makeNoise = async () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio API is not supported in this browser.");
  audioContext = audioContext || new AudioContextClass();
  if (audioContext.state === "suspended") await audioContext.resume();
  const bufferSize = audioContext.sampleRate * 3;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    if (soundType === "brown") { last = (last + (0.035 * white)) / 1.035; data[i] = last * 5; }
    else { data[i] = white * 0.28 + (i > 0 ? data[i - 1] * 0.72 : 0); }
  }
  soundSource = audioContext.createBufferSource();
  soundSource.buffer = buffer; soundSource.loop = true;
  soundGain = audioContext.createGain(); soundGain.gain.value = Number($("#volume-control").value) / 100 * .55;
  soundSource.connect(soundGain).connect(audioContext.destination); soundSource.start();
};
$("#sound-toggle").addEventListener("click", async () => {
  if (soundPlaying) {
    stopNoise();
    soundPlaying = false;
    $("#sound-toggle").textContent = "▶";
    $("#sound-toggle").classList.remove("playing");
    setSoundStatus("Ambient sound paused.");
    return;
  }
  try {
    await makeNoise();
    soundPlaying = true;
    $("#sound-toggle").textContent = "■";
    $("#sound-toggle").classList.add("playing");
    setSoundStatus(`${soundType === "brown" ? "Brown noise" : "Soft rain"} is playing locally.`);
  } catch (error) {
    setSoundStatus(`Audio unavailable: ${error.message}`);
  }
});
$("#volume-control").addEventListener("input", (event) => { $("#volume-value").textContent = `${event.target.value}%`; if (soundGain) soundGain.gain.value = Number(event.target.value) / 100 * .55; });
document.querySelectorAll(".sound-option").forEach((option) => option.addEventListener("click", () => {
  document.querySelectorAll(".sound-option").forEach((item) => item.classList.remove("active"));
  option.classList.add("active"); soundType = option.dataset.sound;
  if (soundPlaying) {
    stopNoise();
    makeNoise().then(() => setSoundStatus(`${soundType === "brown" ? "Brown noise" : "Soft rain"} is playing locally.`)).catch((error) => setSoundStatus(`Audio unavailable: ${error.message}`));
  }
}));

const files = [];
const fileList = $("#file-list");
const addFiles = (incoming) => {
  [...incoming].forEach((file) => { if (!files.some((existing) => existing.name === file.name && existing.size === file.size)) files.push(file); });
  renderFiles();
};
const renderFiles = () => {
  fileList.innerHTML = files.map((file, index) => `<li><span>${file.name}</span><button type="button" data-index="${index}" aria-label="Archive ${file.name}">Archive</button></li>`).join("");
  $("#file-count").textContent = `${files.length} item${files.length === 1 ? "" : "s"}`;
  $("#archive-count").textContent = `${files.length} archived`;
  fileList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { files.splice(Number(button.dataset.index), 1); renderFiles(); }));
};
const dropZone = $("#drop-zone");
dropZone.addEventListener("click", () => $("#file-input").click());
dropZone.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") $("#file-input").click(); });
$("#file-input").addEventListener("change", (event) => addFiles(event.target.files));
["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add("dragging"); }));
["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove("dragging"); }));
dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

const localReflection = (text) => {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "A blank page is a valid place to begin.";
  const first = clean.split(/[.!?]/)[0].slice(0, 90);
  return `A gentle next step: write down one action related to “${first}${first.length === 90 ? "…" : ""}” and give it ten quiet minutes.`;
};
const ollamaUrl = $("#ollama-url");
const ollamaModel = $("#ollama-model");
const modelStatus = $("#model-status");
const provider = $("#ai-provider");
const apiKey = $("#ai-api-key");
const remoteModel = $("#remote-model");
const openaiUrl = $("#openai-url");
const providerNote = $("#provider-note");
let ollamaConnected = false;
let remoteConnected = false;
const savedOllamaUrl = localStorage.getItem("slothspace-ollama-url");
if (savedOllamaUrl) ollamaUrl.value = savedOllamaUrl;
const setModelStatus = (message, connected = false) => {
  ollamaConnected = connected;
  remoteConnected = connected;
  modelStatus.innerHTML = `<span class="status-dot"></span> ${message}`;
};
const updateProviderFields = () => {
  const isOllama = provider.value === "ollama";
  const isGemini = provider.value === "gemini";
  document.querySelectorAll(".ollama-field").forEach((field) => { field.hidden = !isOllama; });
  document.querySelectorAll(".remote-field").forEach((field) => { field.hidden = isOllama; });
  document.querySelectorAll(".openai-field").forEach((field) => { field.hidden = !provider.value || provider.value !== "openai"; });
  $("#ollama-refresh").hidden = !isOllama;
  $("#ollama-connect").textContent = isOllama ? "Connect" : "Test";
  providerNote.textContent = isOllama
    ? "Local Ollama keeps prompts on this device."
    : isGemini
      ? "Gemini sends your prompt to Google. Use a restricted development key."
      : "The endpoint receives your prompt directly from this browser.";
  setModelStatus(isOllama ? "Browser demo mode" : "Not connected");
};
provider.addEventListener("change", updateProviderFields);
updateProviderFields();
const loadOllamaModels = async () => {
  const baseUrl = ollamaUrl.value.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("Enter an Ollama URL.");
  const response = await fetch(`${baseUrl}/api/tags`);
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models : [];
  ollamaModel.innerHTML = models.length
    ? models.map((model) => `<option value="${model.name}">${model.name}</option>`).join("")
    : '<option value="">No models installed</option>';
  if (!models.length) throw new Error("Ollama is running, but no models are installed.");
  localStorage.setItem("slothspace-ollama-url", baseUrl);
  setModelStatus(`${models.length} local model${models.length === 1 ? "" : "s"} available`, true);
};
$("#ollama-refresh").addEventListener("click", async () => {
  try { await loadOllamaModels(); } catch (error) { setModelStatus(`Not connected: ${error.message}`); }
});
const askOllama = async (text) => {
  const response = await fetch(`${ollamaUrl.value.trim().replace(/\/+$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: ollamaModel.value, stream: false, messages: [{ role: "user", content: `Give one gentle next step for: ${text}` }] })
  });
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
  const data = await response.json();
  if (!data.message || !data.message.content) throw new Error("Ollama returned an empty response.");
  return data.message.content;
};
const askGemini = async (text) => {
  if (!apiKey.value.trim()) throw new Error("Enter a Gemini API key.");
  const model = remoteModel.value.trim() || "gemini-2.0-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.value.trim())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `Give one gentle next step for: ${text}` }] }] })
  });
  if (!response.ok) throw new Error(`Gemini returned HTTP ${response.status}.`);
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Gemini returned an empty response.");
  return content;
};
const askOpenAiCompatible = async (text) => {
  if (!apiKey.value.trim()) throw new Error("Enter an API key.");
  const endpoint = openaiUrl.value.trim().replace(/\/+$/, "");
  const model = remoteModel.value.trim();
  if (!endpoint || !model) throw new Error("Enter an endpoint and model.");
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.value.trim()}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: `Give one gentle next step for: ${text}` }] })
  });
  if (!response.ok) throw new Error(`Model endpoint returned HTTP ${response.status}.`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Model endpoint returned an empty response.");
  return content;
};
$("#ollama-connect").addEventListener("click", async () => {
  if (provider.value === "ollama") return;
  const button = $("#ollama-connect");
  button.disabled = true;
  setModelStatus("Testing…");
  try {
    if (!apiKey.value.trim()) throw new Error("Enter an API key.");
    if (provider.value === "gemini") await askGemini("Reply with the single word ready.");
    else await askOpenAiCompatible("Reply with the single word ready.");
    remoteConnected = true;
    setModelStatus(`${provider.value === "gemini" ? "Gemini" : "Custom model"} connected`, true);
    button.textContent = "Connected";
  } catch (error) {
    setModelStatus(`Not connected: ${error.message}`);
    button.textContent = "Retry";
  } finally {
    button.disabled = false;
  }
});
$("#ai-submit").addEventListener("click", async () => {
  const response = $("#ai-response");
  response.textContent = "Reflecting locally…";
  try {
    const text = $("#ai-input").value;
    if (provider.value === "ollama") response.textContent = ollamaConnected ? await askOllama(text) : localReflection(text);
    else if (remoteConnected) response.textContent = provider.value === "gemini" ? await askGemini(text) : await askOpenAiCompatible(text);
    else response.textContent = localReflection(text);
  } catch (error) {
    setModelStatus(`${provider.value === "ollama" ? "Ollama" : "Remote model"} error: ${error.message}`);
    response.textContent = `${localReflection($("#ai-input").value)} (Browser demo used because Ollama was unavailable.)`;
  }
});
