// aba "Jogar": o jogador escolhe as duas personagens que acha mais proximas
// e depois compara com a resposta do algoritmo.
//
// depende de: par-mais-proximo.js (parMaisProximo) e desenho.js

function iniciarJogo() {
  const canvas = document.getElementById("cvJogo");
  if (!canvas) return;

  const MARGEM = 32;
  const RAIO_CLIQUE = 22; // distancia maxima do clique ate a personagem

  const jogo = { pontos: [], escolhidas: [], resultado: null, inicio: 0, fim: 0, quadro: 0 };

  const $ = id => document.getElementById(id);
  const formatarNumero = n => n.toLocaleString("pt-BR");
  const formatarDistancia = d => d.toFixed(1).replace(".", ",") + " m";
  const formatarSegundos = ms => (ms / 1000).toFixed(1).replace(".", ",") + " s";

  // pontos aleatorios com uma distancia minima entre eles, pra nao ficarem
  // um em cima do outro e dar pra clicar em cada um
  function gerarPontos(n) {
    const distanciaMinima = n > 40 ? 26 : 34;
    const pontos = [];
    let tentativas = 0;
    while (pontos.length < n && tentativas++ < 30000) {
      const p = {
        x: MARGEM + Math.random() * (MAPA.largura - 2 * MARGEM),
        y: MARGEM + Math.random() * (MAPA.altura - 2 * MARGEM),
      };
      if (pontos.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= distanciaMinima)) {
        pontos.push({ id: pontos.length + 1, ...p });
      }
    }
    return pontos;
  }

  function novaRodada() {
    jogo.pontos = gerarPontos(Number($("nJogo").value));
    jogo.escolhidas = [];
    jogo.resultado = null;
    jogo.inicio = performance.now();
    $("placarJogo").hidden = true;
    $("dica").textContent = "Clique em duas amigas.";
    $("msgJogo").innerHTML = "<strong>Qual é o par mais próximo?</strong> Clique nas duas amigas que você acha que estão mais perto uma da outra. Com muitas no mapa, o olho engana.";
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
    if (canvas.clientWidth === 0) return; // aba escondida
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
      ? `<strong>Acertou em ${tempo}!</strong> As amigas ${a.id} e ${b.id} são mesmo as mais próximas. O algoritmo chegou lá comparando só ${formatarNumero(comps)} pares.`
      : `<strong>Quase! Ficou ${formatarDistancia(distanciaVoce - best.d)} acima.</strong> Seu par está a ${formatarDistancia(distanciaVoce)}. O mais próximo é o das amigas ${best.a.id} e ${best.b.id}, a ${formatarDistancia(best.d)}. Veja na aba 2 como o algoritmo encontra esse par.`;
    $("placarVoce").textContent = formatarDistancia(distanciaVoce);
    $("placarMelhor").textContent = formatarDistancia(best.d);
    $("placarDc").textContent = formatarNumero(comps);
    $("placarForcaBruta").textContent = formatarNumero(n * (n - 1) / 2);
    $("placarJogo").hidden = false;
    $("dica").textContent = "Rodada encerrada.";
  }

  canvas.addEventListener("click", evento => {
    if (jogo.resultado) return;
    // converte o clique da tela pro espaco 800 x 480
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

    // clicar de novo numa ja escolhida desmarca
    const indice = jogo.escolhidas.indexOf(alvo);
    if (indice >= 0) jogo.escolhidas.splice(indice, 1);
    else jogo.escolhidas.push(alvo);

    $("dica").textContent = jogo.escolhidas.length === 1 ? "Agora escolha a segunda." : "Clique em duas amigas.";
    if (jogo.escolhidas.length === 2) terminarRodada();
    desenhar();
  });

  $("novaRodada").addEventListener("click", novaRodada);
  $("nJogo").addEventListener("change", novaRodada);

  // redesenha quando a aba aparece, a tela muda de tamanho ou o tema muda
  new ResizeObserver(desenhar).observe(canvas);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", desenhar);

  novaRodada();
}

document.addEventListener("DOMContentLoaded", iniciarJogo);
