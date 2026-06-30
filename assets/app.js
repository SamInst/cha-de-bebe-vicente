/* ============================================================
   Chá de Bebê do Vicente — RSVP
   Consome o endpoint público do back-end da pousada.
   ============================================================ */

/* A URL do back-end vem da variável de ambiente API_BASE_URL (configurada na
   Vercel) e é injetada em assets/config.js durante o build.
   Em desenvolvimento local (localhost) usamos http://localhost:8080. */
const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

const API_BASE = isLocal
  ? "http://localhost:8080"
  : (window.API_BASE_URL || "").replace(/\/+$/, "");

if (!isLocal && !API_BASE) {
  console.warn(
    "[RSVP] API_BASE_URL não configurada. Defina a variável de ambiente " +
      "API_BASE_URL nas configurações do projeto na Vercel."
  );
}

const ENDPOINT = `${API_BASE}/cha-de-bebe/confirmar`;

const form = document.getElementById("rsvp-form");
const nomeInput = document.getElementById("nome");
const submitBtn = document.getElementById("submit-btn");
const errorEl = document.getElementById("form-error");
const rsvpSection = document.getElementById("rsvp");
const successSection = document.getElementById("success");
const successName = document.getElementById("success-name");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const nome = nomeInput.value.trim();
  if (nome.length < 2) {
    errorEl.textContent = "Por favor, digite seu nome para confirmar. 🤍";
    nomeInput.focus();
    return;
  }

  setLoading(true);

  try {
    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    showSuccess(nome);
  } catch (err) {
    console.error("Falha ao confirmar:", err);
    errorEl.textContent =
      "Não conseguimos confirmar agora. Verifique sua conexão e tente novamente. 💛";
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("loading", isLoading);
  submitBtn.querySelector(".btn-label").textContent = isLoading
    ? "Confirmando…"
    : "Confirmar presença";
}

function showSuccess(nome) {
  const primeiroNome = nome.split(" ")[0];
  successName.textContent = `Que alegria, ${primeiroNome}! 🤍`;

  rsvpSection.hidden = true;
  successSection.hidden = false;
  successSection.scrollIntoView({ behavior: "smooth", block: "center" });

  rainHearts();
}

/* ---------- Parallax: o ambiente reage ao mouse / inclinação ---------- */
(function setupParallax() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const bear = document.querySelector(".bear-illo img");
  const clouds = Array.from(document.querySelectorAll(".cloud"));
  let tx = 0, ty = 0, cx = 0, cy = 0;

  function apply(nx, ny) {
    // nx, ny variam de -1 a 1
    tx = nx; ty = ny;
  }

  window.addEventListener("mousemove", (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    apply(nx, ny);
  });

  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (e.gamma == null) return;
      apply(
        Math.max(-1, Math.min(1, e.gamma / 30)),
        Math.max(-1, Math.min(1, (e.beta - 45) / 30))
      );
    },
    true
  );

  function tick() {
    // suaviza o movimento
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;

    if (bear) bear.style.translate = `${cx * 12}px ${cy * 8}px`;
    clouds.forEach((c, i) => {
      const depth = (i % 2 === 0 ? 1 : -1) * (6 + i * 4);
      c.style.marginLeft = `${cx * depth}px`;
      c.style.marginTop = `${cy * depth * 0.5}px`;
    });

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* Corações subindo na tela ao confirmar */
function rainHearts() {
  const layer = document.getElementById("hearts");
  const symbols = ["🤍", "🧸", "💛", "☁️", "⭐"];
  const total = 26;

  for (let i = 0; i < total; i++) {
    const s = document.createElement("span");
    s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    s.style.left = `${Math.random() * 100}vw`;
    s.style.fontSize = `${1 + Math.random() * 1.6}rem`;
    s.style.setProperty("--dur", `${2.6 + Math.random() * 2.2}s`);
    s.style.setProperty("--rot", `${(Math.random() * 80 - 40).toFixed(0)}deg`);
    s.style.animationDelay = `${Math.random() * 0.8}s`;
    layer.appendChild(s);
    setTimeout(() => s.remove(), 5200);
  }
}
