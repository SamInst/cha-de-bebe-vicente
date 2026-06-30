// Gera assets/config.js a partir da variável de ambiente da Vercel.
// Defina API_BASE_URL nas Environment Variables do projeto na Vercel.
const fs = require("fs");
const path = require("path");

const base = (process.env.API_BASE_URL || "").trim();
const out = path.join(__dirname, "assets", "config.js");

fs.writeFileSync(
  out,
  `// Arquivo gerado automaticamente no build (não editar à mão).\n` +
    `window.API_BASE_URL = ${JSON.stringify(base)};\n`
);

console.log("config.js gerado -> API_BASE_URL =", base || "(vazio)");
