/* ============================================================
   Chá de bebê — RSVP
   Consome o endpoint público do back-end da pousada.
   (O parallax e o contador ficam em event.js, usados por todas
   as páginas.)
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

const ENDPOINT = `${API_BASE}${(window.EVENTO || {}).apiConfirmar || "/cha-de-bebe/confirmar"}`;

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
  successName.textContent = `Que alegria, ${primeiroNome}! ${(window.EVENTO || {}).coracao || "🤍"}`;

  rsvpSection.hidden = true;
  successSection.hidden = false;
  successSection.scrollIntoView({ behavior: "smooth", block: "center" });

  rainHearts();
}

/* Símbolos do tema subindo na tela ao confirmar */
function rainHearts() {
  const layer = document.getElementById("hearts");
  const symbols = (window.EVENTO || {}).chuva || ["🤍", "🧸", "💛", "☁️", "⭐"];
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
