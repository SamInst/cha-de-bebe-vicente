/* ============================================================
   Build do convite.

   Lê os dados do evento em evento.json, aplica por cima as variáveis
   de ambiente (Vercel → Settings → Environment Variables, ou um arquivo
   .env local) e gera o site pronto em dist/.

   Variáveis de ambiente (todas opcionais — sem elas vale o evento.json):
     BEBE_NOME            nome do bebê                 ex.: Celina
     BEBE_GENERO          menina | menino              (troca cores, imagens e textos)
     EVENTO_DATA          data e hora local            ex.: 2026-11-22T16:00
     EVENTO_FUSO          fuso da data                 ex.: -03:00
     EVENTO_LOCAL_NOME    nome do local                ex.: Arthur Pesque Pague
     EVENTO_LOCAL_ENDERECO endereço                    ex.: MA-014
     EVENTO_MAPA_URL      link do Google Maps
     API_BASE_URL         back-end das confirmações (padrão: api.baseUrl do evento.json)
     API_CONFIRMAR_PATH   rota POST de confirmação     (padrão /cha-de-bebe/confirmar)
     API_LISTA_PATH       rota GET da lista            (padrão /cha-de-bebe/confirmacoes)
     SITE_URL             URL pública (deixa a prévia do WhatsApp com imagem)
   ============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "dist");

/* ---------- .env local (sem dependências) ---------- */
function carregarDotEnv() {
  const arq = path.join(ROOT, ".env");
  if (!fs.existsSync(arq)) return;
  for (const linha of fs.readFileSync(arq, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || process.env[m[1]] !== undefined) continue; // a env real tem prioridade
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
carregarDotEnv();

const env = (k) => (process.env[k] || "").trim();

/* ---------- Temas por gênero ----------
   Tudo o que muda entre menina e menino fica aqui: palavras, emojis e
   imagens. As cores e o fundo animado ficam no CSS ([data-tema="..."]). */
const TEMAS = {
  menina: {
    artigo: "da",
    artDef: "a",
    nossa: "nossa",
    pequena: "pequena",
    realeza: "princesa",
    emoji: "🎀",
    coracao: "🩷",
    chuva: ["🩷", "🎀", "🤍", "🌸", "✨"],
    capa: { src: "assets/temas/menina/laco-aquarela.png", alt: "Laço rosa em aquarela" },
    mascote: { src: "assets/temas/menina/urso-baloes.png", alt: "Ursinha segurando balões rosa" },
    ogImagem: "assets/temas/menina/urso-baloes.png",
  },
  menino: {
    artigo: "do",
    artDef: "o",
    nossa: "nosso",
    pequena: "pequeno",
    realeza: "príncipe",
    emoji: "🧸",
    coracao: "💙",
    chuva: ["🤍", "🧸", "💛", "☁️", "⭐"],
    capa: { src: "assets/temas/menino/urso.png", alt: "Ursinho com balões e luazinha sobre uma nuvem" },
    mascote: null,
    ogImagem: "assets/temas/menino/urso.png",
  },
};

/* ---------- Dados ---------- */
const base = JSON.parse(fs.readFileSync(path.join(ROOT, "evento.json"), "utf8"));

const genero = (env("BEBE_GENERO") || base.genero || "menina").toLowerCase();
if (!TEMAS[genero]) {
  console.error(`BEBE_GENERO inválido: "${genero}". Use "menina" ou "menino".`);
  process.exit(1);
}
const tema = TEMAS[genero];

const nome = env("BEBE_NOME") || base.nome;
const apiBase = env("API_BASE_URL") || (base.api && base.api.baseUrl) || "";
const dataLocal = env("EVENTO_DATA") || base.data;
const fuso = env("EVENTO_FUSO") || base.fuso || "-03:00";
const local = {
  ...base.local,
  nome: env("EVENTO_LOCAL_NOME") || base.local.nome,
  endereco: env("EVENTO_LOCAL_ENDERECO") || base.local.endereco,
  mapa: env("EVENTO_MAPA_URL") || base.local.mapa,
};

const m = dataLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
if (!m) {
  console.error(`EVENTO_DATA inválida: "${dataLocal}". Formato: 2026-11-22T16:00`);
  process.exit(1);
}
const [, ano, mes, dia, hh, mi] = m;
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
  "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado"];
const diaSemana = SEMANA[new Date(Date.UTC(+ano, +mes - 1, +dia)).getUTCDay()];
const mesNome = MESES[+mes - 1];
const horaCurta = mi === "00" ? `${+hh}h` : `${+hh}h${mi}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const site = (env("SITE_URL") ||
  (env("VERCEL_PROJECT_PRODUCTION_URL") ? `https://${env("VERCEL_PROJECT_PRODUCTION_URL")}` : "")
).replace(/\/+$/, "");

/* ---------- Valores usados nos templates ---------- */
const v = {
  nome,
  genero,
  ehMenina: genero === "menina",
  ...tema,
  // "Chá da Celina" / "Chá do Vicente"
  titulo: `Chá ${tema.artigo} ${nome}`,
  dataLonga: `${cap(diaSemana)}, ${+dia} de ${mesNome}`,
  dataCurta: `${+dia} de ${mesNome}`,
  hora: horaCurta,
  dataTexto: `${cap(diaSemana)}, ${+dia} de ${mesNome} · às ${horaCurta}`,
  mesAbrev: mesNome.slice(0, 3).toUpperCase(),
  diaSemanaCaixa: diaSemana.split("-")[0].toUpperCase(),
  dia: String(+dia),
  horaRelogio: `${hh}:${mi}`,
  versiculoTexto: base.versiculo ? base.versiculo.texto : "",
  versiculoRef: base.versiculo ? base.versiculo.referencia : "",
  presenteItem: base.presente ? base.presente.item : "",
  presenteMarcas: base.presente ? base.presente.marcas : "",
  presenteExtra: base.presente ? base.presente.extra : "",
  localNome: local.nome,
  localEndereco: local.endereco,
  localReferencia: local.referencia || "",
  localMapa: local.mapa,
  capaSrc: tema.capa.src,
  capaAlt: tema.capa.alt,
  ogImagem: site ? `${site}/${tema.ogImagem}` : `./${tema.ogImagem}`,
  mimoExtra: base.mimoExtra || "",
  versao: Date.now().toString(36), // cache-bust dos assets a cada build
};

/* ---------- Template ----------
   {{chave}}   → valor escapado
   {{{chave}}} → HTML pronto (gerado aqui no build)
   {{#chave}}...{{/chave}} → só aparece se o valor existir */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function render(tpl, dados) {
  // blocos condicionais podem ser aninhados: repete até não sobrar nenhum
  let antes;
  do {
    antes = tpl;
    tpl = tpl.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, k, bloco) => (dados[k] ? bloco : ""));
  } while (tpl !== antes);
  return tpl
    .replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => lookup(dados, k))
    .replace(/\{\{(\w+)\}\}/g, (_, k) => esc(lookup(dados, k)));
}
function lookup(dados, k) {
  if (!(k in dados)) throw new Error(`Template usa {{${k}}}, mas esse valor não existe.`);
  return dados[k] == null ? "" : dados[k];
}

/* Blocos de HTML gerados a partir dos dados */
v.mimosHtml = (base.mimos || [])
  .map((x) => `<li>${esc(x.item)}${x.nota ? `\n                <small>${esc(x.nota)}</small>` : ""}</li>`)
  .join("\n              ");

v.mascoteHtml = tema.mascote
  ? `<div class="mascote reveal" style="--d:3"><img src="./${tema.mascote.src}" alt="${esc(tema.mascote.alt)}" data-parallax="10" loading="lazy" /></div>`
  : "";

v.fundoHtml = genero === "menina" ? fundoMenina() : fundoMenino();

function fundoMenino() {
  const estrelas = [1, 2, 3, 4, 5, 6].map((i) => `<span class="star s${i}"></span>`).join("");
  const nuvens = Array.from({ length: 10 }, (_, i) =>
    `<div class="cloud c${i + 1}" data-parallax="${(i % 2 ? -1 : 1) * (6 + i * 4)}"></div>`).join("\n    ");
  return `${estrelas}\n    ${nuvens}`;
}

function fundoMenina() {
  // laçinhos e corações que flutuam devagar sobre as listras
  const lacos = [
    ["laco-cetim", 8, 10, 74, 0, 16],
    ["lacinho-esq", 82, 18, 58, -6, 19],
    ["lacinho-dir", 12, 58, 52, -11, 22],
    ["laco-cetim", 86, 66, 60, -3, 18],
    ["lacinho-dir", 50, 88, 46, -14, 24],
    ["lacinho-esq", 30, 34, 40, -9, 21],
    ["laco-cetim", 66, 44, 38, -17, 26],
  ];
  const html = lacos.map(([img, x, y, w, atraso, dur], i) =>
    `<img class="laco-flutua" src="./assets/temas/menina/${img}.png" alt="" ` +
    `style="--x:${x}%;--y:${y}%;--w:${w}px;--atraso:${atraso}s;--dur:${dur}s" data-parallax="${(i % 2 ? -1 : 1) * (5 + i * 3)}" />`);
  const coracoes = [6, 22, 40, 58, 74, 92].map((x, i) =>
    `<span class="coracao-sobe" style="--x:${x}%;--atraso:${-i * 3.4}s;--dur:${17 + (i % 3) * 4}s">♥</span>`);
  return [...html, ...coracoes].join("\n    ");
}

/* ---------- config.js lido pelo navegador ---------- */
const configJs =
  `// Gerado automaticamente pelo build (node build.js). Não editar à mão.\n` +
  `window.API_BASE_URL = ${JSON.stringify(apiBase)};\n` +
  `window.EVENTO = ${JSON.stringify({
    nome,
    genero,
    artigo: tema.artigo,
    iso: `${dataLocal}:00${fuso}`,
    texto: v.dataTexto,
    coracao: tema.coracao,
    emoji: tema.emoji,
    chuva: tema.chuva,
    apiConfirmar: env("API_CONFIRMAR_PATH") || "/cha-de-bebe/confirmar",
    apiLista: env("API_LISTA_PATH") || "/cha-de-bebe/confirmacoes",
  }, null, 2)};\n`;

/* ---------- Gera dist/ ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, "assets"), path.join(OUT, "assets"), { recursive: true });
fs.writeFileSync(path.join(OUT, "assets", "config.js"), configJs);

for (const arq of fs.readdirSync(SRC).filter((f) => f.endsWith(".html"))) {
  const tpl = fs.readFileSync(path.join(SRC, arq), "utf8");
  fs.writeFileSync(path.join(OUT, arq), render(tpl, v));
}

console.log(`dist/ gerado → ${v.titulo} (${genero}) · ${v.dataTexto}`);
console.log(`API_BASE_URL = ${apiBase || "(vazio)"}`);
