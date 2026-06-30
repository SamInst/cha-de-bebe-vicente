/* ============================================================
   Chá de Bebê do Vicente — Lista de confirmados
   ============================================================ */

const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

const API_BASE = isLocal
  ? "http://localhost:8080"
  : (window.API_BASE_URL || "").replace(/\/+$/, "");

const ENDPOINT = `${API_BASE}/cha-de-bebe/confirmacoes`;

const listEl = document.getElementById("guest-list");
const stateEl = document.getElementById("list-state");
const countText = document.getElementById("count-text");

function formatarData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }) + " · " + d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function render(lista) {
  const total = lista.length;
  countText.textContent =
    total === 0
      ? "Nenhuma confirmação ainda"
      : total === 1
      ? "1 pessoa confirmada"
      : `${total} pessoas confirmadas`;

  if (total === 0) {
    listEl.innerHTML =
      '<p class="list-state">Ainda não há confirmações. Assim que alguém confirmar, aparece aqui. 🤍</p>';
    return;
  }

  listEl.innerHTML = lista
    .map((c, i) => {
      const nome = (c.nome || "").toLowerCase();
      const quando = formatarData(c.confirmadoEm);
      return `
        <div class="guest" style="--i:${i}">
          <span class="guest-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="guest-name">${escapeHtml(nome)}</span>
          ${quando ? `<span class="guest-when">${quando}</span>` : ""}
        </div>`;
    })
    .join("");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

async function carregar() {
  try {
    const resp = await fetch(ENDPOINT, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const lista = await resp.json();
    render(Array.isArray(lista) ? lista : []);
  } catch (err) {
    console.error("Falha ao carregar lista:", err);
    countText.textContent = "Erro ao carregar";
    listEl.innerHTML =
      '<p class="list-state">Não foi possível carregar a lista agora. Tentando de novo em instantes… 💛</p>';
  }
}

carregar();
// atualiza sozinha a cada 20s
setInterval(carregar, 20000);
