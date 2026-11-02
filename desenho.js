// funcoes de desenho no canvas, usadas pelo jogo (jogo.js) e pela
// animacao do algoritmo (animacao.js).
//
// tudo e desenhado num espaco logico de 800 x 480 (o mesmo das coordenadas
// dos pontos); prepCanvas cuida de escalar isso pro tamanho real da tela.

const MAPA = { largura: 800, altura: 480 };

// uma cor por personagem, escolhida pelo id do ponto
const CORES_PERSONAGEM = ["#ff7aa8", "#6fd0bb", "#ffc94d", "#a08fff", "#ff9f6b", "#6cb8ff"];

// le uma variavel de cor do style.css (ex.: "--cor-mapa"), com valor padrao
// caso ela nao exista
function corCSS(nome, padrao) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || padrao;
}

// ajusta o tamanho real do canvas a largura que ele ocupa na tela (e a
// densidade de pixels do aparelho, pra nao ficar borrado) e devolve o ctx
// ja escalado pro espaco 800 x 480
function prepCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const largura = Math.max(1, Math.round(canvas.clientWidth * dpr));
  if (canvas.width !== largura) {
    canvas.width = largura;
    canvas.height = Math.round(largura * MAPA.altura / MAPA.largura);
  }
  const escala = canvas.width / MAPA.largura;
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  return ctx;
}

// fundo do mapa: gramado com ruas em grade
function desenhaMapa(ctx) {
  ctx.fillStyle = corCSS("--cor-mapa", "#f1faf4");
  ctx.fillRect(0, 0, MAPA.largura, MAPA.altura);

  ctx.save();
  ctx.strokeStyle = corCSS("--cor-rua", "#dceee3");
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  for (let x = 100; x < MAPA.largura; x += 200) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, MAPA.altura);
    ctx.stroke();
  }
  for (let y = 120; y < MAPA.altura; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(MAPA.largura, y);
    ctx.stroke();
  }
  ctx.restore();
}

// desenha a personagem na posicao do ponto.
// opcoes: apagada (fica transparente), anel (cor do contorno de destaque),
// rotulo (mostra o numero do id no lugar do rostinho)
function desenhaPersonagem(ctx, ponto, { apagada = false, anel = null, rotulo = false } = {}) {
  const { x, y } = ponto;
  const corRosto = "#2b1d34";

  ctx.save();
  ctx.globalAlpha = apagada ? 0.25 : 1;

  if (anel) {
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = anel;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(x, y, 9.5, 0, Math.PI * 2);
  ctx.fillStyle = CORES_PERSONAGEM[ponto.id % CORES_PERSONAGEM.length];
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = corCSS("--cor-texto", corRosto);
  ctx.stroke();

  ctx.fillStyle = corRosto;
  if (rotulo) {
    ctx.font = "700 10px Nunito, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ponto.id, x, y + 0.5);
  } else {
    // olhos e sorriso
    ctx.beginPath();
    ctx.arc(x - 3, y - 1.5, 1.6, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 1.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + 1.5, 3, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = corRosto;
    ctx.stroke();
  }
  ctx.restore();
}

// linha entre dois pontos.
// opcoes: largura, tracejado, texto (rotulo no meio da linha, ex.: a distancia)
function linhaPar(ctx, a, b, cor, { largura = 3, tracejado = false, texto = null } = {}) {
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.lineCap = "round";
  if (tracejado) ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  if (texto) {
    const meioX = (a.x + b.x) / 2;
    const meioY = (a.y + b.y) / 2 - 16;
    ctx.setLineDash([]);
    ctx.font = "500 12px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const larguraTexto = ctx.measureText(texto).width + 10;
    ctx.fillStyle = corCSS("--cor-superficie", "#ffffff");
    ctx.fillRect(meioX - larguraTexto / 2, meioY - 9, larguraTexto, 18);
    ctx.fillStyle = cor;
    ctx.fillText(texto, meioX, meioY);
  }
  ctx.restore();
}
