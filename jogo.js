function iniciarJogo() {
  const canvas = document.getElementById("cvJogo");
  if (!canvas) return;

  const RAIO_CLIQUE = 22;

  const jogo = { pontos: [], escolhidas: [], resultado: null, inicio: 0, fim: 0, quadro: 0 };

  const $ = id => document.getElementById(id);
  const formatarNumero = n => n.toLocaleString("pt-BR");
  const formatarDistancia = d => d.toFixed(1).replace(".", ",") + " m";
  const formatarSegundos = ms => (ms / 1000).toFixed(1).replace(".", ",") + " s";

  function novaRodada() {
    const n = Number($("nJogo").value);
    jogo.pontos = pontosAleatorios(n, n > 40 ? 26 : 34);
    jogo.escolhidas = [];
    jogo.resultado = null;
    jogo.inicio = performance.now();
    $("placarJogo").hidden = true;
    $("dica").textContent = "Clique em duas amigas.";
    $("msgJogo").innerHTML = "<strong>Quem estacionou mais perto?</strong> Clique nas duas amigas que você acha que estão mais perto uma da outra.";
    cancelAnimationFrame(jogo.quadro);
    atualizarCronometro();
    desenhar();
  }

  function atualizarCronometro() {
    const agora = jogo.resultado ? jogo.fim : performance.now();
    $("cronometro").textContent = formatarSegundos(agora - jogo.inicio);
    if (!jogo.resultado) jogo.quadro = requestAnimationFrame(atualizarCronometro);
  }

  function desenhar() {
    if (canvas.clientWidth === 0) return;
    const ctx = prepCanvas(canvas);
    const corVoce = corCSS("--cor-voce", "#e09b00");
    const corPar = corCSS("--cor-par", "#178f79");
    desenhaMapa(ctx);

    if (jogo.resultado) {
      const { best } = jogo.resultado;
      const [a, b] = jogo.escolhidas;
      linhaPar(ctx, best.a, best.b, corPar, { largura: 5, texto: formatarDistancia(best.d) });
      const acertou = new Set([a.id, b.id, best.a.id, best.b.id]).size === 2;
      if (!acertou) {
        linhaPar(ctx, a, b, corVoce, { largura: 4, tracejado: true, texto: formatarDistancia(Math.hypot(a.x - b.x, a.y - b.y)) });
      }
    }

    for (const p of jogo.pontos) {
      let anel = null;
      if (jogo.escolhidas.includes(p)) anel = corVoce;
      if (jogo.resultado && (p === jogo.resultado.best.a || p === jogo.resultado.best.b)) anel = corPar;
      desenhaPersonagem(ctx, p, { anel });
    }
  }

  function terminarRodada() {
    jogo.fim = performance.now();
    jogo.resultado = parMaisProximo(jogo.pontos);

    const n = jogo.pontos.length;
    const [a, b] = jogo.escolhidas;
    const { best, comps } = jogo.resultado;
    const distanciaVoce = Math.hypot(a.x - b.x, a.y - b.y);
    const acertou = Math.abs(distanciaVoce - best.d) < 1e-9;
    const tempo = formatarSegundos(jogo.fim - jogo.inicio);

    $("msgJogo").innerHTML = acertou
      ? `<strong>Acertou em ${tempo}!</strong> Essas duas são mesmo as mais próximas. O algoritmo achou elas comparando ${formatarNumero(comps)} pares.`
      : `<strong>Quase!</strong> Seu par está a ${formatarDistancia(distanciaVoce)}, mas tinha um a ${formatarDistancia(best.d)} (a linha verde). Dá uma olhada na aba 2 pra ver como o algoritmo achou.`;
    $("placarVoce").textContent = formatarDistancia(distanciaVoce);
    $("placarMelhor").textContent = formatarDistancia(best.d);
    $("placarDc").textContent = formatarNumero(comps);
    $("placarForcaBruta").textContent = formatarNumero(n * (n - 1) / 2);
    $("placarJogo").hidden = false;
    $("dica").textContent = "Rodada encerrada.";
  }

  canvas.addEventListener("click", evento => {
    if (jogo.resultado) return;
    const caixa = canvas.getBoundingClientRect();
    const x = (evento.clientX - caixa.left) * MAPA.largura / caixa.width;
    const y = (evento.clientY - caixa.top) * MAPA.altura / caixa.height;

    let alvo = null;
    let menor = RAIO_CLIQUE;
    for (const p of jogo.pontos) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < menor) { menor = d; alvo = p; }
    }
    if (!alvo) return;

    const indice = jogo.escolhidas.indexOf(alvo);
    if (indice >= 0) jogo.escolhidas.splice(indice, 1);
    else jogo.escolhidas.push(alvo);

    $("dica").textContent = jogo.escolhidas.length === 1 ? "Agora escolha a segunda." : "Clique em duas amigas.";
    if (jogo.escolhidas.length === 2) terminarRodada();
    desenhar();
  });

  $("novaRodada").addEventListener("click", novaRodada);
  $("nJogo").addEventListener("change", novaRodada);

  new ResizeObserver(desenhar).observe(canvas);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", desenhar);

  novaRodada();
}

document.addEventListener("DOMContentLoaded", iniciarJogo);
