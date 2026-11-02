// aba "Ver o algoritmo": reproduz, passo a passo, os eventos que
// parMaisProximo(pontos, eventos) registra.
//
// depende de:
//   par-mais-proximo.js -> parMaisProximo
//   desenho.js          -> prepCanvas(canvas) (devolve o ctx ja escalado pra 800 x 480),
//                          desenhaMapa(ctx),
//                          desenhaPersonagem(ctx, ponto, { apagada, anel, rotulo }),
//                          linhaPar(ctx, a, b, cor, { tracejado, texto, largura })
//   index.html          -> <canvas id="cvAlg">; os controles, a mensagem e o
//                          placar sao criados aqui, em volta dele
//
// cores lidas do css (com valor padrao se a variavel nao existir):
//   --cor-destaque (par sendo comparado), --cor-par (melhor par de cada regiao),
//   --cor-faixa (faixa de largura 2 delta), --cor-texto (linhas divisorias)

function iniciarAnimacao() {
  const canvas = document.getElementById("cvAlg");
  if (!canvas) return;

  const LARGURA = 800;
  const ALTURA = 480;
  const MARGEM = 32;
  const DISTANCIA_MINIMA = 46; // espaco entre personagens pra caber o numero

  const estado = { pontos: [], eventos: [], passo: 0, timer: 0 };

  // ---- controles, mensagem e placar ----
  const controles = document.createElement("div");
  controles.className = "alg-controles";
  controles.innerHTML = `
    <button type="button" id="algInicio">Início</button>
    <button type="button" id="algVoltar">Voltar</button>
    <button type="button" id="algPlay">Reproduzir</button>
    <button type="button" id="algAvancar">Avançar</button>
    <label for="algVelocidade">Velocidade
      <select id="algVelocidade">
        <option value="900">lenta</option>
        <option value="450" selected>normal</option>
        <option value="140">rápida</option>
      </select>
    </label>
    <label for="algQtd">Pontos
      <select id="algQtd"><option>12</option><option selected>20</option><option>32</option></select>
    </label>
    <button type="button" id="algNovos">Novos pontos</button>`;
  canvas.before(controles);

  const mensagem = document.createElement("p");
  mensagem.className = "alg-mensagem";
  const placar = document.createElement("div");
  placar.className = "alg-placar";
  placar.innerHTML = `
    <div><span>Passo</span> <strong id="algPasso">–</strong></div>
    <div><span>Nível da recursão</span> <strong id="algNivel">–</strong></div>
    <div><span>Comparações até agora</span> <strong id="algComps">–</strong></div>
    <div><span>Força bruta faria</span> <strong id="algForcaBruta">–</strong></div>`;
  canvas.after(mensagem, placar);

  const $ = id => document.getElementById(id);
  const formatarNumero = n => n.toLocaleString("pt-BR");
  const formatarDistancia = d => d.toFixed(1).replace(".", ",") + " m";

  function cor(nome, padrao) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || padrao;
  }

  // ---- pontos e eventos ----
  function gerarPontos(n) {
    const pontos = [];
    let tentativas = 0;
    while (pontos.length < n && tentativas++ < 20000) {
      const p = {
        x: MARGEM + Math.random() * (LARGURA - 2 * MARGEM),
        y: MARGEM + Math.random() * (ALTURA - 2 * MARGEM),
      };
      if (pontos.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= DISTANCIA_MINIMA)) {
        pontos.push({ id: pontos.length + 1, ...p });
      }
    }
    return pontos;
  }

  function novosPontos() {
    parar();
    estado.pontos = gerarPontos(Number($("algQtd").value));
    estado.eventos = [];
    const { best, comps } = parMaisProximo(estado.pontos, estado.eventos);
    // passo extra no fim so pra mostrar o resultado final
    estado.eventos.push({ t: "fim", best, comps, lo: 0, hi: LARGURA, depth: 0 });
    estado.passo = 0;
    desenhar();
  }

  // ---- texto de cada passo ----
  function explicar(e) {
    const P = p => `P${p.id}`;
    switch (e.t) {
      case "divide":
        return `<strong>Dividir.</strong> ${e.n} pontos nesta região. A linha vertical separa ${e.m} à esquerda e ${e.n - e.m} à direita, e cada lado é resolvido separadamente.`;
      case "cmp":
        return `<strong>Caso base (até 3 pontos).</strong> Com poucos pontos, compara direto: ${P(e.a)} e ${P(e.b)} estão a ${formatarDistancia(e.d)}.`;
      case "base":
        return `<strong>Caso base resolvido.</strong> O melhor par desta região é ${P(e.best.a)}–${P(e.best.b)}, a ${formatarDistancia(e.best.d)}.`;
      case "strip":
        return `<strong>Combinar.</strong> O melhor dos dois lados é δ = ${formatarDistancia(e.delta)}. Um par melhor só pode cruzar a linha se os dois pontos estiverem a menos de δ dela: ${e.ids.length} ponto(s) na faixa.`;
      case "scmp":
        return `<strong>Checando a faixa.</strong> Em ordem de y, ${P(e.a)} e ${P(e.b)} estão a ${formatarDistancia(e.d)}. ${e.melhor ? "Novo melhor par!" : "Não melhora."}`;
      case "merge":
        return `<strong>Região resolvida.</strong> Melhor par: ${P(e.best.a)}–${P(e.best.b)}, a ${formatarDistancia(e.best.d)}. Volta um nível na recursão.`;
      case "fim": {
        const n = estado.pontos.length;
        return `<strong>Pronto: ${P(e.best.a)} e ${P(e.best.b)}, a ${formatarDistancia(e.best.d)}.</strong> Foram ${formatarNumero(e.comps)} comparações; a força bruta faria ${formatarNumero(n * (n - 1) / 2)}.`;
      }
    }
  }

  // ---- desenho ----
  // refaz tudo do evento 0 ate o passo atual, assim o "Voltar" nao precisa
  // guardar estado nenhum
  function desenhar() {
    if (canvas.clientWidth === 0) return; // aba escondida
    const ctx = prepCanvas(canvas);
    const corDestaque = cor("--cor-destaque", "#d6286f");
    const corPar = cor("--cor-par", "#178f79");
    const corFaixa = cor("--cor-faixa", "#e09b00");
    const corTexto = cor("--cor-texto", "#2b1d34");

    const linhas = [];
    let resolvidas = [];
    for (let i = 0; i <= estado.passo; i++) {
      const e = estado.eventos[i];
      if (e.t === "divide") linhas.push(e);
      if (e.t === "base" || e.t === "merge") {
        // a regiao resolvida substitui os pares das sub-regioes dela
        resolvidas = resolvidas.filter(r => !(r.lo >= e.lo && r.hi <= e.hi));
        resolvidas.push(e);
      }
    }
    const e = estado.eventos[estado.passo];

    desenhaMapa(ctx);

    // regiao da chamada atual
    if (e.t !== "fim") {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = corDestaque;
      ctx.fillRect(e.lo, 0, e.hi - e.lo, ALTURA);
      ctx.restore();
    }

    // faixa de largura 2 delta em volta da linha
    if (e.t === "strip" || e.t === "scmp") {
      const x0 = Math.max(e.lo, e.x - e.delta);
      const x1 = Math.min(e.hi, e.x + e.delta);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = corFaixa;
      ctx.fillRect(x0, 0, x1 - x0, ALTURA);
      ctx.restore();
    }

    // linhas divisorias: mais fortes nos niveis mais altos da recursao
    for (const l of linhas) {
      ctx.save();
      ctx.strokeStyle = corTexto;
      ctx.globalAlpha = Math.max(0.25, 0.8 - l.depth * 0.15);
      ctx.lineWidth = Math.max(1, 3 - l.depth * 0.6);
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(l.x, 0);
      ctx.lineTo(l.x, ALTURA);
      ctx.stroke();
      ctx.restore();
    }

    if (e.t === "fim") {
      linhaPar(ctx, e.best.a, e.best.b, corPar, { largura: 6, texto: formatarDistancia(e.best.d) });
    } else {
      for (const r of resolvidas) linhaPar(ctx, r.best.a, r.best.b, corPar, { largura: 3 });
    }
    if (e.t === "cmp" || e.t === "scmp") {
      linhaPar(ctx, e.a, e.b, corDestaque, { largura: 4, texto: formatarDistancia(e.d) });
    }

    const naFaixa = e.ids ? new Set(e.ids) : null;
    for (const p of estado.pontos) {
      const foraDaRegiao = e.t !== "fim" && (p.x < e.lo || p.x > e.hi);
      const foraDaFaixa = naFaixa && !naFaixa.has(p.id);
      let anel = null;
      if ((e.t === "cmp" || e.t === "scmp") && (p === e.a || p === e.b)) anel = corDestaque;
      if (e.t === "fim" && (p === e.best.a || p === e.best.b)) anel = corPar;
      desenhaPersonagem(ctx, p, { apagada: foraDaRegiao || foraDaFaixa, anel, rotulo: true });
    }

    const n = estado.pontos.length;
    mensagem.innerHTML = explicar(e);
    $("algPasso").textContent = `${estado.passo + 1} de ${estado.eventos.length}`;
    $("algNivel").textContent = e.t === "fim" ? "–" : e.depth;
    $("algComps").textContent = formatarNumero(e.comps);
    $("algForcaBruta").textContent = formatarNumero(n * (n - 1) / 2);
    $("algVoltar").disabled = estado.passo === 0;
    $("algAvancar").disabled = estado.passo === estado.eventos.length - 1;
  }

  // ---- reproducao ----
  function parar() {
    clearInterval(estado.timer);
    estado.timer = 0;
    $("algPlay").textContent = "Reproduzir";
  }

  function reproduzir() {
    if (estado.timer) return parar();
    if (estado.passo >= estado.eventos.length - 1) estado.passo = 0;
    $("algPlay").textContent = "Pausar";
    estado.timer = setInterval(() => {
      if (estado.passo >= estado.eventos.length - 1) return parar();
      estado.passo++;
      desenhar();
    }, Number($("algVelocidade").value));
  }

  function irPara(passo) {
    parar();
    estado.passo = Math.max(0, Math.min(estado.eventos.length - 1, passo));
    desenhar();
  }

  $("algPlay").addEventListener("click", reproduzir);
  $("algInicio").addEventListener("click", () => irPara(0));
  $("algVoltar").addEventListener("click", () => irPara(estado.passo - 1));
  $("algAvancar").addEventListener("click", () => irPara(estado.passo + 1));
  $("algNovos").addEventListener("click", novosPontos);
  $("algQtd").addEventListener("change", novosPontos);
  $("algVelocidade").addEventListener("change", () => {
    if (estado.timer) { parar(); reproduzir(); }
  });

  // redesenha quando a aba aparece ou a tela muda de tamanho; se a aba for
  // escondida no meio da reproducao, pausa
  new ResizeObserver(() => {
    if (canvas.clientWidth === 0) parar();
    else desenhar();
  }).observe(canvas);

  novosPontos();
}

document.addEventListener("DOMContentLoaded", iniciarAnimacao);
