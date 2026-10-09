const activities = [
  { id: "neighborhood-noticing", title: "The neighborhood noticing walk", setting: "outdoor", minutes: 20, effort: "gentle", description: "Walk one familiar block as if it is new. Find one tiny detail in each color of the rainbow.", benefit: "A gentle walk adds movement to your day. Even a little is a worthwhile start.", instruction: "Leave your phone in your pocket. Notice five colors, three sounds, and one thing you have never seen before." },
  { id: "bird-minute", title: "Five-minute bird radio", setting: "outdoor", minutes: 10, effort: "gentle", description: "Find a safe place to stand or sit. Listen for layers: near, far, and somewhere in between.", benefit: "A quiet pause can give your attention a break from constant inputs.", instruction: "Pick a safe spot. Close your eyes if comfortable, and count different bird calls without needing to name them." },
  { id: "leaf-collection", title: "A pocket-sized leaf museum", setting: "outdoor", minutes: 20, effort: "gentle", description: "Collect three fallen leaves. Compare their edges, veins, and colors, then leave them somewhere new.", benefit: "A slow nature task makes space for curiosity and an easy change of pace.", instruction: "Only pick up fallen leaves. Find three different shapes, then return them to the ground when you are done." },
  { id: "garden-reset", title: "Ten-minute garden reset", setting: "outdoor", minutes: 10, effort: "lively", description: "Water one thirsty plant, pull a few weeds, or clear one small patch. Stop when the timer ends.", benefit: "Light gardening can turn a short break into gentle movement and time outdoors.", instruction: "Choose one small patch. Work at a comfortable pace, and stop if anything feels painful or unsafe." },
  { id: "walk-and-stretch", title: "Walk, then stretch in the sun", setting: "outdoor", minutes: 20, effort: "lively", description: "Take an easy loop, then stretch your shoulders and calves somewhere comfortable.", benefit: "Moving more often supports general health; keep the pace comfortable for you.", instruction: "Walk at a pace where you can talk. Finish with a few gentle stretches, without forcing a range of motion." },
  { id: "porch-mobility", title: "Porch-side body wake-up", setting: "outdoor", minutes: 10, effort: "lively", description: "Step outside for a few shoulder rolls, calf raises, and an easy lap around your space.", benefit: "Short movement breaks can help break up long stretches of sitting.", instruction: "Try 5 slow shoulder rolls, 8 comfortable calf raises, then walk one easy lap. Use a support if needed." },
  { id: "window-weather", title: "Window-side weather watch", setting: "indoor", minutes: 10, effort: "gentle", description: "Make a warm drink, sit by a window, and watch the weather change for a few minutes.", benefit: "A screen-free pause gives your eyes and attention a chance to rest.", instruction: "Put the phone in another room. Find three things moving outside: clouds, branches, or passing light." },
  { id: "plant-care", title: "Tend one houseplant", setting: "indoor", minutes: 10, effort: "gentle", description: "Check the soil, wipe a leaf, and turn your plant toward the light if it needs it.", benefit: "A small hands-on task can help you pause and focus on one thing at a time.", instruction: "Check the soil before watering. Remove only dry leaves, and give the plant a little room to breathe." },
  { id: "stretch-break", title: "The between-meetings stretch", setting: "indoor", minutes: 10, effort: "lively", description: "Stand up for a few gentle reaches, shoulder rolls, and a slow lap around your room.", benefit: "Regular activity supports health; a brief movement break is a friendly place to begin.", instruction: "Stand only if that is comfortable. Roll your shoulders, reach gently, and walk at a pace that feels right." },
  { id: "make-something", title: "Make a snack from scratch", setting: "indoor", minutes: 20, effort: "gentle", description: "Make something simple with what is already in the kitchen. Keep the phone out of reach while you prep.", benefit: "A tactile, everyday task can be a satisfying reset from passive screen time.", instruction: "Pick a simple snack you already know how to make. Leave the phone elsewhere and enjoy the small steps." },
  { id: "indoor-dance", title: "One-song kitchen dance", setting: "indoor", minutes: 10, effort: "lively", description: "Put on a song you already have downloaded. Move however feels good, then take a breath.", benefit: "Dancing is one way to add movement; choose a pace that feels safe and enjoyable.", instruction: "Choose a song stored on your device. Keep the floor clear and move in a way that feels comfortable." },
];

const preference = { setting: "outdoor", minutes: 20, energy: "gentle" };
const storageKey = "outside-in-progress-v1";
let currentPick = null;
let installedModels = [];
let installPrompt = null;
let timerInterval = null;
let toastTimeout = null;

const elements = {
  form: document.querySelector("#preferences-form"),
  findButton: document.querySelector("#find-button"),
  findButtonLabel: document.querySelector("#find-button-label"),
  status: document.querySelector("#model-status"),
  statusText: document.querySelector("#model-status-text"),
  result: document.querySelector("#activity-result"),
  dialog: document.querySelector("#session-dialog"),
  clock: document.querySelector("#session-clock"),
  state: document.querySelector("#session-state"),
  toast: document.querySelector("#toast"),
};

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      minutes: Number(saved.minutes) || 0,
      sessions: Number(saved.sessions) || 0,
      days: Array.isArray(saved.days) ? saved.days.slice(-7) : [],
    };
  } catch {
    return { minutes: 0, sessions: 0, days: [] };
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    showToast("Progress could not be saved on this device.");
  }
}

function renderProgress() {
  const progress = readProgress();
  document.querySelector("#minutes-total").textContent = progress.minutes;
  document.querySelector("#sessions-total").textContent = progress.sessions;
  const today = new Date();
  const bars = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const minutes = progress.days.find((day) => day.date === key)?.minutes || 0;
    const height = Math.min(48, 6 + minutes * 1.6);
    const bar = document.createElement("span");
    bar.className = `day-bar${minutes ? " has-activity" : ""}${index === 6 ? " is-today" : ""}`;
    bar.style.setProperty("--bar-height", `${height}px`);
    bar.title = `${date.toLocaleDateString(undefined, { weekday: "short" })}: ${minutes} minutes`;
    bar.setAttribute("aria-label", bar.title);
    return bar;
  });
  document.querySelector("#week-track").replaceChildren(...bars);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => elements.toast.classList.remove("is-visible"), 3000);
}

function setModelStatus(state, text) {
  elements.status.className = `model-status ${state ? `is-${state}` : ""}`;
  elements.statusText.textContent = text;
}

async function refreshModels() {
  try {
    const response = await fetch("/api/models");
    const data = await response.json();
    installedModels = data.available ? data.models : [];
    if (installedModels.length) setModelStatus("ready", `Local AI ready: ${installedModels[0]}`);
    else setModelStatus("missing", "Offline picker ready · add local AI anytime");
  } catch {
    installedModels = [];
    setModelStatus("missing", "Offline picker ready · no model connection");
  }
}

function getCandidates() {
  return activities.filter((activity) => {
    const fitsSetting = preference.setting === "either" || activity.setting === preference.setting;
    const fitsTime = activity.minutes <= preference.minutes;
    const fitsEnergy = preference.energy === "gentle" || activity.effort === "lively";
    return fitsSetting && fitsTime && fitsEnergy;
  });
}

function rulePick(candidates) {
  const fit = candidates.filter((activity) => activity.minutes === preference.minutes);
  const choices = fit.length ? fit : candidates;
  return choices[Math.floor(Math.random() * choices.length)];
}

function paintPick(activity, nudge, source) {
  currentPick = activity;
  document.querySelector("#result-setting").textContent = activity.setting === "outdoor" ? "OUTDOORS" : "AT HOME";
  document.querySelector("#result-duration").textContent = `${activity.minutes} MINUTES / ${activity.effort === "gentle" ? "EASYGOING" : "LIVELY"}`;
  document.querySelector("#result-title").textContent = activity.title;
  document.querySelector("#result-description").textContent = activity.description;
  document.querySelector("#result-benefit").textContent = activity.benefit;
  document.querySelector("#model-nudge").textContent = `${source} ${nudge}`;
  elements.result.hidden = false;
  elements.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function getAiPick(candidates) {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: installedModels[0],
      preferences: { ...preference },
      candidates: candidates.map(({ id, title, description, minutes, effort, setting }) => ({ id, title, description, minutes, effort, setting })),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Local model is unavailable.");
  const activity = candidates.find((item) => item.id === data.activityId);
  if (!activity) throw new Error("The local model returned an invalid pick.");
  return { activity, nudge: data.nudge, source: `LOCAL AI (${data.model}) ·` };
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const candidates = getCandidates();
  if (!candidates.length) {
    showToast("Try more time or a different energy setting.");
    return;
  }

  elements.findButton.disabled = true;
  elements.findButtonLabel.textContent = installedModels.length ? "Asking your local model" : "Finding a good fit";
  setModelStatus(installedModels.length ? "thinking" : "missing", installedModels.length ? "Thinking stays on your device" : "Choosing from the offline guide");

  if (installedModels.length) {
    try {
      const pick = await getAiPick(candidates);
      paintPick(pick.activity, pick.nudge, pick.source);
      setModelStatus("ready", `Local AI ready: ${installedModels[0]}`);
    } catch {
      const activity = rulePick(candidates);
      paintPick(activity, "A good day can start with one small thing.", "OFFLINE GUIDE ·");
      setModelStatus("missing", "Local model unavailable · offline picker ready");
      showToast("Local AI is unavailable, so your offline guide picked instead.");
    }
  } else {
    const activity = rulePick(candidates);
    paintPick(activity, "A good day can start with one small thing.", "OFFLINE GUIDE ·");
  }

  elements.findButton.disabled = false;
  elements.findButtonLabel.textContent = "Find my next reset";
});

function setChoice(selector, attribute, value) {
  document.querySelectorAll(selector).forEach((button) => {
    const selected = button.dataset[attribute] === String(value);
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

document.querySelectorAll("[data-setting]").forEach((button) => button.addEventListener("click", () => {
  preference.setting = button.dataset.setting;
  setChoice("[data-setting]", "setting", preference.setting);
}));
document.querySelectorAll("[data-minutes]").forEach((button) => button.addEventListener("click", () => {
  preference.minutes = Number(button.dataset.minutes);
  setChoice("[data-minutes]", "minutes", preference.minutes);
}));
document.querySelectorAll("[data-energy]").forEach((button) => button.addEventListener("click", () => {
  preference.energy = button.dataset.energy;
  setChoice("[data-energy]", "energy", preference.energy);
}));

function updateClock() {
  const session = JSON.parse(localStorage.getItem("outside-in-session-v1") || "null");
  if (!session) return;
  const remaining = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
  elements.clock.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  if (remaining === 0) {
    elements.state.textContent = "Time is up. Come back whenever you are ready.";
    clearInterval(timerInterval);
  }
}

document.querySelector("#start-button").addEventListener("click", () => {
  if (!currentPick) return;
  document.querySelector("#session-activity").textContent = currentPick.title;
  document.querySelector("#session-instruction").textContent = currentPick.instruction;
  localStorage.setItem("outside-in-session-v1", JSON.stringify({ id: currentPick.id, minutes: currentPick.minutes, startedAt: Date.now(), endsAt: Date.now() + currentPick.minutes * 60 * 1000 }));
  elements.state.textContent = "Your timer keeps its place if the screen sleeps.";
  updateClock();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateClock, 1000);
  elements.dialog.showModal();
});

function finishSession() {
  const session = JSON.parse(localStorage.getItem("outside-in-session-v1") || "null");
  if (!session) return;
  const elapsed = Math.max(1, Math.min(session.minutes, Math.floor((Date.now() - session.startedAt) / 60000)));
  const progress = readProgress();
  const dayKey = new Date().toISOString().slice(0, 10);
  const today = progress.days.find((day) => day.date === dayKey);
  if (today) today.minutes += elapsed;
  else progress.days.push({ date: dayKey, minutes: elapsed });
  progress.days = progress.days.slice(-7);
  progress.minutes += elapsed;
  progress.sessions += 1;
  saveProgress(progress);
  localStorage.removeItem("outside-in-session-v1");
  clearInterval(timerInterval);
  elements.dialog.close();
  renderProgress();
  showToast(`${elapsed} ${elapsed === 1 ? "minute" : "minutes"}, well spent. Welcome back.`);
}

document.querySelector("#complete-button").addEventListener("click", finishSession);
document.querySelector("#close-session").addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("close", () => clearInterval(timerInterval));

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  document.querySelector("#install-button").hidden = false;
});
document.querySelector("#install-button").addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  document.querySelector("#install-button").hidden = true;
});

function drawFieldScene() {
  const canvas = document.querySelector("#field-scene");
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  context.fillStyle = "#dce5d6";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#f0c767";
  context.beginPath();
  context.arc(592, 77, 38, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#a9c2a6";
  context.beginPath();
  context.moveTo(0, 199);
  context.quadraticCurveTo(150, 120, 310, 192);
  context.quadraticCurveTo(460, 245, 760, 137);
  context.lineTo(760, 340);
  context.lineTo(0, 340);
  context.fill();
  context.fillStyle = "#6f9872";
  context.beginPath();
  context.moveTo(0, 248);
  context.quadraticCurveTo(170, 182, 339, 248);
  context.quadraticCurveTo(540, 310, 760, 205);
  context.lineTo(760, 340);
  context.lineTo(0, 340);
  context.fill();
  context.fillStyle = "#d5aa6b";
  context.beginPath();
  context.moveTo(370, 340);
  context.bezierCurveTo(405, 289, 449, 259, 459, 222);
  context.bezierCurveTo(469, 187, 450, 157, 432, 137);
  context.lineTo(459, 137);
  context.bezierCurveTo(493, 164, 514, 199, 498, 236);
  context.bezierCurveTo(484, 278, 443, 307, 429, 340);
  context.closePath();
  context.fill();

  function tree(x, y, scale) {
    context.fillStyle = "#604f3b";
    context.fillRect(x - 4 * scale, y, 8 * scale, 37 * scale);
    context.fillStyle = "#355d43";
    context.beginPath();
    context.arc(x, y - 5 * scale, 18 * scale, 0, Math.PI * 2);
    context.arc(x - 13 * scale, y + 3 * scale, 12 * scale, 0, Math.PI * 2);
    context.arc(x + 13 * scale, y + 3 * scale, 12 * scale, 0, Math.PI * 2);
    context.fill();
  }

  tree(109, 172, 1.18);
  tree(163, 205, 0.72);
  tree(653, 172, 1.05);
  tree(698, 190, 0.69);
  context.strokeStyle = "rgb(36 74 56 / 18%)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(22, 40);
  context.lineTo(84, 40);
  context.moveTo(676, 284);
  context.lineTo(738, 284);
  context.stroke();
}

drawFieldScene();
renderProgress();
refreshModels();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));