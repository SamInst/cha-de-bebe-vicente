/* ============================================================
   Chá de Bebê do Vicente — dados do evento + comportamentos
   compartilhados por todas as páginas.
   ============================================================ */

/* Data/hora do evento com fuso explícito: assim o contador marca o
   mesmo tempo restante mesmo para quem estiver em outro fuso. */
const EVENTO = {
  iso: "2026-08-22T16:00:00-03:00",
  texto: "Sábado, 22 de agosto · às 16h",
};

/* ---------- Contador regressivo ---------- */
(function setupCountdown() {
  const root = document.getElementById("countdown");
  if (!root) return;

  const alvo = new Date(EVENTO.iso).getTime();
  const campos = {
    dias: root.querySelector('[data-unit="dias"]'),
    horas: root.querySelector('[data-unit="horas"]'),
    minutos: root.querySelector('[data-unit="minutos"]'),
    segundos: root.querySelector('[data-unit="segundos"]'),
  };
  const legenda = document.getElementById("countdown-note");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function render() {
    const restante = alvo - Date.now();

    if (restante <= 0) {
      root.classList.add("is-over");
      Object.values(campos).forEach((el) => el && (el.textContent = "00"));
      if (legenda) legenda.textContent = "É hoje! Chegou o grande dia do Vicente 🧸🤍";
      return true; // acabou: pode parar o timer
    }

    const seg = Math.floor(restante / 1000);
    const dias = Math.floor(seg / 86400);
    const horas = Math.floor((seg % 86400) / 3600);
    const minutos = Math.floor((seg % 3600) / 60);
    const segundos = seg % 60;

    if (campos.dias) campos.dias.textContent = pad(dias);
    if (campos.horas) campos.horas.textContent = pad(horas);
    if (campos.minutos) campos.minutos.textContent = pad(minutos);
    if (campos.segundos) campos.segundos.textContent = pad(segundos);
    return false;
  }

  if (render()) return;
  const timer = setInterval(() => {
    if (render()) clearInterval(timer);
  }, 1000);
})();

/* ---------- Abas que expandem no lugar ----------
   A altura é animada em pixels (e não com max-height) porque o Safari do
   iOS não interpola bem alturas automáticas. Ao terminar de abrir voltamos
   para `auto`, assim o painel acompanha mudanças de conteúdo — como a
   troca do formulário pela mensagem de presença confirmada. */
(function setupAccordion() {
  const items = Array.from(document.querySelectorAll(".acc-item"));
  if (!items.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function partes(item) {
    return {
      trigger: item.querySelector(".acc-trigger"),
      panel: item.querySelector(".acc-panel"),
    };
  }

  /* altura atual de verdade: se o clique pegar o painel no meio da animação,
     partimos de onde ele está em vez de dar um salto. */
  function alturaAtual(panel) {
    return panel.hidden ? 0 : panel.getBoundingClientRect().height;
  }

  function abrir(item) {
    const { trigger, panel } = partes(item);
    const inicio = alturaAtual(panel);

    item.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    panel.hidden = false;

    if (reduce) {
      panel.style.height = "auto";
      return;
    }
    panel.style.height = `${inicio}px`;
    // força o layout antes de animar, senão o navegador junta os dois passos
    void panel.offsetHeight;
    panel.style.height = `${panel.scrollHeight}px`;
  }

  function fechar(item) {
    const { trigger, panel } = partes(item);
    if (!item.classList.contains("is-open")) return;

    item.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");

    if (reduce) {
      panel.hidden = true;
      return;
    }
    panel.style.height = `${alturaAtual(panel)}px`;
    void panel.offsetHeight;
    panel.style.height = "0px";
  }

  /* Cada aba diz como quer ser mostrada (data-scroll no HTML):
     "start"  → leva só o cabeçalho ao topo e deixa o conteúdo correr para
                baixo, natural para a lista longa de mimos;
     "center" → centraliza a aba inteira na tela, que cabe de uma vez. */
  function mostrar(item) {
    const modo = item.dataset.scroll === "center" ? "center" : "start";
    item.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: modo });
  }

  items.forEach((item) => {
    const { trigger, panel } = partes(item);

    panel.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "height") return;
      if (item.classList.contains("is-open")) {
        panel.style.height = "auto"; // acompanha o conteúdo depois de aberto
        if (item.dataset.rolarAoAbrir) {
          delete item.dataset.rolarAoAbrir;
          mostrar(item);
        }
      } else {
        panel.hidden = true;
      }
    });

    trigger.addEventListener("click", () => {
      const jaAberto = item.classList.contains("is-open");

      // uma aba por vez: assim a página não vira um rolo sem fim no celular
      items.forEach((outro) => outro !== item && fechar(outro));

      if (jaAberto) {
        fechar(item);
        return;
      }

      abrir(item);

      if (item.dataset.scroll === "center" && !reduce) {
        // centralizar só faz sentido com a altura final: espera a animação
        item.dataset.rolarAoAbrir = "1";
      } else {
        // acompanha a expansão desde o começo
        setTimeout(() => mostrar(item), 60);
      }
    });
  });

  /* Link direto para uma aba: /#mimos, /#confirmar, /#local */
  const alvo = decodeURIComponent(location.hash.replace("#", ""));
  if (alvo) {
    const item = items.find((i) => {
      const p = i.querySelector(".acc-panel");
      return p && p.id === alvo;
    });
    if (item) {
      abrir(item);
      setTimeout(() => mostrar(item), 300);
    }
  }
})();

/* ---------- Parallax: o ambiente reage ao mouse / inclinação ---------- */
(function setupParallax() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const bear = document.querySelector(".bear-illo img");
  const clouds = Array.from(document.querySelectorAll(".cloud"));
  if (!bear && !clouds.length) return;

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
