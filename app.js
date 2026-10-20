const $ = (selector) => document.querySelector(selector);

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
$("#ai-submit").addEventListener("click", () => {
  const response = $("#ai-response");
  response.textContent = "Reflecting locally…";
  setTimeout(() => { response.textContent = localReflection($("#ai-input").value); }, 350);
});
