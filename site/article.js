/* The diagrams describe available workflows, not a recorded agent transcript. */
const configurations = [
  {
    id: "one-shot", title: "Astra one-shot", subtitle: "One proposal, no model revision",
    steps: [
      ["agent", "Propose a solution", "Astra receives the task and references, then produces a controller and motion inputs in one response."],
      ["simulation", "Test in simulation", "The runner executes the solution with SONIC. The controller can use feedback during execution."],
      ["evidence", "Measure the outcome", "The external evaluator scores the recorded motion. These results are not returned to the model for another proposal."],
    ],
  },
  {
    id: "plain", title: "Codex", subtitle: "An autonomous coding session",
    steps: [
      ["agent", "Inspect and choose an approach", "Codex reads the prepared task and references. Its conversation and workspace persist across attempts."],
      ["tools", "Write and run code", "Standard coding tools let it inspect inputs, build controllers and run computations. It implements any extra robotics helpers it needs."],
      ["simulation", "Test a candidate", "The controller and motion references run in MuJoCo with SONIC. The simulator records the executed motion."],
      ["feedback", "Inspect the result", "Simulation observations return through the tools. In the same Codex session, Astra can read measurements, inspect images and examine its code."],
      ["revision", "Revise and test again", "It chooses what to change and which trials to run next, retaining useful code and results in the same session."],
    ],
  },
  {
    id: "ensemble", title: "Orchestration", subtitle: "Four agents, optional retargeting tools",
    steps: [
      ["workers", "Start four independent refinements", "Each sandbox receives the same task and references. Two sessions use standard coding tools; two also receive optional retargeting tools for contact, geometry and tracking analysis, which they may use, modify or replace."],
      ["simulation", "Test and revise independently", "Each session chooses its own trials and revises its controller or references. It keeps its own history and receives feedback from its executions."],
      ["feedback", "Continue refinement", "Evidence returns to the session that produced the trial. Discoveries are not shared between the four sessions."],
      ["evidence", "Select one final submission", "Python compares the independently evaluated final submissions and selects the valid execution with the lowest mean ADD. Position and orientation errors are reported for that same motion."],
    ],
  },
];

function node(id, kind, x, y, width, title, detail = "", height = 52) {
  const model = kind === "agent";
  const tool = kind === "native-tools" || kind === "toolkit";
  const iconSize = model ? (width < 150 ? 28 : 40) : 20;
  const titleY = y + (detail ? 22 : height / 2 + 4);
  const groupLeft = x + (width - iconSize - 10 - title.length * 7) / 2;
  const iconY = titleY - iconSize / 2 - 4;
  return `<g class="diagram-node ${kind}" data-node="${id}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10"/>
    ${model ? `<image href="assets/openai.svg" x="${groupLeft}" y="${iconY}" width="${iconSize}" height="${iconSize}" aria-hidden="true"/>` : ""}
    ${tool ? `<g class="tool-icon ${kind === "toolkit" ? "robot-arm-icon" : "toolbox-icon"}" transform="translate(${groupLeft} ${iconY})" aria-hidden="true">
      ${kind === "toolkit" ? `
        <path d="M2 18 H10 M4 18 V15 H8 V18 M6 13 V15 M7.7 10.9 L11.3 8.1 M11.6 5.6 L9.4 3.4 M10 2 H15 M15 2 V6 M15 6 L12 8 M15 6 L18 8"/>
        <circle cx="6" cy="12" r="2"/><circle cx="13" cy="7" r="2"/><circle cx="8" cy="2" r="1.5"/>`
        : '<path d="M6 6 V3 H14 V6 M2 6 H18 V18 H2 Z M2 11 H18 M7 9 V13 M13 9 V13"/>'}
    </g>` : ""}
    <text ${model || tool ? 'class="icon-label"' : ''} x="${model || tool ? groupLeft + iconSize + 10 : x + width / 2}" y="${titleY}">${title}</text>
    ${detail ? `<text class="node-detail" x="${x + width / 2}" y="${y + 39}">${detail}</text>` : ""}
  </g>`;
}

function diagram(config) {
  const id = config.id;
  const edge = (name, path, optional = false) => `<path data-edge="${name}" class="diagram-edge${optional ? " optional" : ""}" d="${path}" marker-end="url(#arrow-${id})"/>`;
  const scope = (label, height) => `<rect class="diagram-scope" x="62" y="22" width="298" height="${height}" rx="14"/><text class="scope-label" x="79" y="43">${label}</text>`;
  const runtime = node("simulation", "simulation", 85, 295, 250, "Simulation") +
    node("evidence", "evidence", 85, 375, 250, "Results");
  let flow;
  if (id === "one-shot") {
    flow = node("inputs", "artifact", 85, 35, 250, "Task and references") +
      node("agent", "agent", 85, 140, 250, "Astra") + runtime +
      edge("agent", "M210 87 V137") + edge("simulation", "M210 192 V292") +
      edge("evidence", "M210 347 V372");
  } else if (id === "ensemble") {
    flow = node("inputs", "artifact", 85, 25, 250, "Task and references", "", 45) +
      '<rect class="diagram-scope" x="50" y="99" width="304" height="167" rx="14"/><text class="scope-label" x="66" y="117">Four isolated Codex sessions</text>' +
      node("plain1", "agent", 61, 131, 136, "Codex", "") +
      node("plain2", "agent", 208, 131, 136, "Codex", "") +
      node("tools1", "agent", 61, 200, 136, "Codex", "") +
      node("tools2", "agent", 208, 200, 136, "Codex", "") +
      node("simulation", "simulation", 85, 300, 250, "Simulation") +
      node("evidence", "evidence", 85, 381, 250, "Select one submission", "Python: lowest valid mean ADD") +
      edge("workers", "M210 70 V96") + edge("simulation", "M210 266 V297") +
      edge("feedback", "M85 326 H30 V188 H47") + edge("evidence", "M210 352 V378");
  } else {
    flow = scope("Persistent session", 264) +
      node("agent", "agent", 85, 100, 250, "Codex", "Plan, test, refine", 70) +
      node("simulation", "simulation", 85, 350, 250, "Simulation", "", 60) +
      edge("simulation", "M180 170 V347") +
      edge("feedback", "M240 350 V173") +
      '<text class="edge-label" x="165" y="260" text-anchor="end">Execute</text>' +
      '<text class="edge-label" x="255" y="260">Feedback</text>';

  }
  return `<svg viewBox="0 0 390 445" role="img" aria-label="${config.title} workflow">
    <defs><marker id="arrow-${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z"/></marker></defs>
    ${flow}
  </svg>`;
}

const highlights = {
  agent: ["agent"], tools: ["agent"],
  simulation: ["simulation"], evidence: ["evidence"], feedback: ["agent"], revision: ["agent"],
  workers: ["plain1", "plain2", "tools1", "tools2"],
};

const configurationRoot = document.querySelector("#configuration-diagrams");
for (const config of configurationRoot ? configurations : []) {
  const card = document.createElement("article");
  card.className = "configuration-card";
  card.innerHTML = `<header><h4>${config.title}</h4><p>${config.subtitle}</p></header>
    ${diagram(config)}
    <div class="step-controls"><button type="button" data-step="previous" aria-label="Previous step in ${config.title}">←</button>
      <span class="step-count"></span><button type="button" data-playback aria-label="Pause automatic flow">Pause</button><button type="button" data-step="next">Step through →</button></div>
    <div class="step-description" aria-live="polite" aria-atomic="true"><h5></h5><p></p></div>`;
  let current = 0, visible = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;
  const playback = card.querySelector('[data-playback]');
  function updatePlayback() {
    playback.textContent = playing ? 'Pause' : 'Play';
    playback.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' automatic flow');
    card.classList.toggle('is-playing', playing && visible && !document.hidden);
    card.querySelector('.step-description').setAttribute('aria-live', playing ? 'off' : 'polite');
  }
  playback.addEventListener('click', () => { playing = !playing; updatePlayback(); });
  reducedMotion.addEventListener('change', () => { playing = !reducedMotion.matches; updatePlayback(); });
  document.addEventListener('visibilitychange', updatePlayback);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updatePlayback(); }, {threshold: .2}).observe(card);
  setInterval(() => {
    if (playing && visible && !document.hidden) { current = (current + 1) % config.steps.length; showStep(); }
  }, 3200);
  function showStep() {
    const [key, title, description] = config.steps[current];
    const active = config.id === "ensemble" && key === "feedback" ? highlights.workers : highlights[key];
    card.querySelectorAll("[data-node]").forEach(el => el.classList.toggle("is-active", active.includes(el.dataset.node)));
    card.querySelectorAll("[data-edge]").forEach(el => el.classList.toggle("is-active", el.dataset.edge === key));
    card.querySelector(".step-count").textContent = `${current + 1} / ${config.steps.length}`;
    card.querySelector("h5").textContent = title;
    card.querySelector(".step-description p").textContent = description;
    card.querySelector('[data-step="previous"]').disabled = current === 0;
    const next = card.querySelector('[data-step="next"]');
    const restartLabel = config.id === "one-shot" || config.id === "ensemble" ? "Replay steps ↺" : "Next iteration ↺";
    next.textContent = current === config.steps.length - 1 ? restartLabel : "Step through →";
    next.setAttribute("aria-label", `${next.textContent} in ${config.title}`);
  }
  card.querySelectorAll("[data-step]").forEach(button => button.addEventListener("click", () => {
    playing = false; updatePlayback();
    current = button.dataset.step === "next" ? (current + 1) % config.steps.length : Math.max(0, current - 1);
    showStep();
  }));
  configurationRoot.append(card);
  showStep();
  updatePlayback();
}

// One contents tree serves both the desktop rail and the mobile disclosure.
const contents = document.querySelector(".contents");
const toggle = contents.querySelector(".contents-toggle");
toggle.addEventListener("click", () => {
  const expanded = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.querySelector("span").textContent = expanded ? "−" : "＋";
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
    toggle.setAttribute("aria-expanded", "false");
    toggle.querySelector("span").textContent = "＋";
    toggle.focus();
  }
});
contents.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  toggle.setAttribute("aria-expanded", "false");
  toggle.querySelector("span").textContent = "＋";
}));

const tocLinks = [...contents.querySelectorAll("a")];
const sections = tocLinks.map(link => ({link, target: document.getElementById(link.hash.slice(1))})).filter(item => item.target);
let scheduled = false;
function updateContents() {
  let active = sections[0]?.link;
  for (const {link, target} of sections) {
    if (target.getBoundingClientRect().top <= 120) active = link;
  }
  tocLinks.forEach(link => {
    if (link === active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scheduled = false;
}
window.addEventListener("scroll", () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateContents); }
}, {passive: true});
updateContents();

// Opening a contents link into the appendix also reveals its answer.
function revealAppendixTarget() {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!target) return;
  const details = target.closest('details');
  if (details) { details.open = true; requestAnimationFrame(() => target.scrollIntoView()); }
}
addEventListener('hashchange', revealAppendixTarget);
revealAppendixTarget();
