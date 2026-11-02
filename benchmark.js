const TAMANHOS_BENCHMARK = [10, 50, 100, 500, 1000, 2000, 5000];

function medirTamanho(n) {
  const pontos = Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    x: Math.random() * 1e6,
    y: Math.random() * 1e6,
  }));

  let inicio = performance.now();
  const fb = forcaBruta(pontos);
  const tempoFb = performance.now() - inicio;

  inicio = performance.now();
  const dc = parMaisProximo(pontos);
  const tempoDc = performance.now() - inicio;

  return {
    n,
    compsFb: fb.comps,
    compsDc: dc.comps,
    tempoFb,
    tempoDc,
    mesmoResultado: Math.abs(fb.best.d - dc.best.d) < 1e-9,
  };
}

function iniciarBenchmark() {
  const secao = document.getElementById("view-desempenho");
  if (!secao) return;

  const caixa = document.createElement("div");
  caixa.className = "benchmark";
  caixa.innerHTML = `
    <div class="benchmark-topo">
      <h2>Comparações de distância por número de pontos</h2>
      <button type="button" id="benchRodar">Rodar de novo</button>
    </div>
    <div class="benchmark-grafico">
      <svg id="benchGrafico" viewBox="0 0 640 300" role="img"
        aria-label="Gráfico em escala logarítmica comparando força bruta e dividir e conquistar"></svg>
    </div>
    <p class="benchmark-legenda">
      <span style="color: var(--cor-destaque)">● força bruta, O(n²)</span>
      <span style="color: var(--cor-par)">● dividir e conquistar, O(n log n)</span>
      <span>os dois eixos em escala logarítmica</span>
    </p>
    <div class="benchmark-tabela">
      <table>
        <thead><tr>
          <th>Pontos</th><th>Comparações FB</th><th>Comparações D&amp;C</th>
          <th>Vezes menos</th><th>Tempo FB</th><th>Tempo D&amp;C</th><th>Mesmo resultado</th>
        </tr></thead>
        <tbody id="benchTabela"></tbody>
      </table>
    </div>`;
  secao.append(caixa);

  const formatarNumero = n => n.toLocaleString("pt-BR");
  const formatarTempo = ms => ms.toFixed(ms < 10 ? 2 : 0).replace(".", ",") + " ms";
  const tabela = document.getElementById("benchTabela");
  const botao = document.getElementById("benchRodar");

  function rodar() {
    botao.disabled = true;
    tabela.innerHTML = `<tr><td colspan="7">Medindo…</td></tr>`;
    setTimeout(() => {
      const medicoes = TAMANHOS_BENCHMARK.map(medirTamanho);
      tabela.innerHTML = medicoes.map(m => `
        <tr>
          <td>${formatarNumero(m.n)}</td>
          <td>${formatarNumero(m.compsFb)}</td>
          <td>${formatarNumero(m.compsDc)}</td>
          <td>${(m.compsFb / m.compsDc).toFixed(1).replace(".", ",")}×</td>
          <td>${formatarTempo(m.tempoFb)}</td>
          <td>${formatarTempo(m.tempoDc)}</td>
          <td>${m.mesmoResultado ? "sim" : "NÃO"}</td>
        </tr>`).join("");
      desenharGrafico(medicoes);
      botao.disabled = false;
    }, 30);
  }

  function desenharGrafico(medicoes) {
    const svg = document.getElementById("benchGrafico");
    const ESQ = 64, DIR = 620, TOPO = 16, BASE = 250;
    const MIN_EXP = 1, MAX_EXP = 8;
    const logMin = Math.log10(medicoes[0].n);
    const logMax = Math.log10(medicoes[medicoes.length - 1].n);
    const x = i => ESQ + (DIR - ESQ) * (Math.log10(medicoes[i].n) - logMin) / (logMax - logMin);
    const y = v => BASE - (BASE - TOPO) * (Math.log10(v) - MIN_EXP) / (MAX_EXP - MIN_EXP);
    const EXPOENTES = ["", "", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸"];
    const estiloTexto = "fill: var(--cor-texto-suave); font: 12px monospace";

    let s = "";
    for (let p = MIN_EXP; p <= MAX_EXP; p++) {
      s += `<line x1="${ESQ}" x2="${DIR}" y1="${y(10 ** p)}" y2="${y(10 ** p)}" style="stroke: var(--cor-linha)"/>`;
      s += `<text x="${ESQ - 8}" y="${y(10 ** p) + 4}" text-anchor="end" style="${estiloTexto}">10${EXPOENTES[p]}</text>`;
    }
    medicoes.forEach((m, i) => {
      s += `<text x="${x(i)}" y="${BASE + 22}" text-anchor="middle" style="${estiloTexto}">${formatarNumero(m.n)}</text>`;
    });
    s += `<text x="${(ESQ + DIR) / 2}" y="${BASE + 42}" text-anchor="middle" style="${estiloTexto}">número de pontos</text>`;

    const series = [
      ["compsFb", "var(--cor-destaque)"],
      ["compsDc", "var(--cor-par)"],
    ];
    for (const [campo, cor] of series) {
      const pontos = medicoes.map((m, i) => `${x(i)},${y(m[campo])}`).join(" ");
      s += `<polyline points="${pontos}" style="fill: none; stroke: ${cor}; stroke-width: 3; stroke-linejoin: round"/>`;
      medicoes.forEach((m, i) => {
        s += `<circle cx="${x(i)}" cy="${y(m[campo])}" r="4" style="fill: ${cor}"/>`;
      });
      const ultima = medicoes[medicoes.length - 1];
      s += `<text x="${DIR}" y="${y(ultima[campo]) - 10}" text-anchor="end" style="${estiloTexto}; fill: ${cor}">${formatarNumero(ultima[campo])}</text>`;
    }
    svg.innerHTML = s;
  }

  botao.addEventListener("click", rodar);

  const observador = new ResizeObserver(() => {
    if (secao.clientWidth > 0) {
      observador.disconnect();
      rodar();
    }
  });
  observador.observe(secao);
}

document.addEventListener("DOMContentLoaded", iniciarBenchmark);
