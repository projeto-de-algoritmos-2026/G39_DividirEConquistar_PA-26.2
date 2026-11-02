// par de pontos mais proximos: forca bruta (gabarito) e dividir e conquistar.
//
// ponto: { id, x, y }. as duas funcoes devolvem { best: { a, b, d }, comps },
// onde a e b sao os proprios objetos de ponto recebidos, d e a distancia
// entre eles e comps e quantas distancias foram calculadas.

// largura do mapa (espaco logico do canvas). so serve pra dar os limites da
// regiao da primeira chamada nos eventos da animacao.
const LARGURA_MAPA = 800;

// Math.sqrt em vez de Math.hypot: o hypot e varias vezes mais lento, e a
// forca bruta com 5000 pontos chama essa funcao 12,5 milhoes de vezes
function distancia(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// compara todos os pares: n(n-1)/2 distancias, O(n^2)
function forcaBruta(pontos) {
  let best = null;
  let comps = 0;
  for (let i = 0; i < pontos.length; i++) {
    for (let j = i + 1; j < pontos.length; j++) {
      comps++;
      const d = distancia(pontos[i], pontos[j]);
      if (!best || d < best.d) best = { a: pontos[i], b: pontos[j], d };
    }
  }
  return { best, comps };
}

// dividir e conquistar, O(n log n).
// se "eventos" for um array, cada passo e registrado nele pra animacao.
function parMaisProximo(pontos, eventos = null) {
  let comps = 0;
  if (pontos.length < 2) return { best: null, comps };

  // ordena por x e por y uma unica vez, antes da recursao. reordenar a cada
  // nivel deixaria o algoritmo O(n log^2 n).
  // desempate por y e id pra pontos com o mesmo x nao baguncarem a divisao.
  const Px = [...pontos].sort((a, b) => a.x - b.x || a.y - b.y || a.id - b.id);
  const Py = [...pontos].sort((a, b) => a.y - b.y || a.x - b.x || a.id - b.id);

  // Px e Py tem os mesmos pontos (os da regiao atual), ordenados por x e por y.
  // lo e hi sao os limites em x da regiao, so pra animacao saber onde desenhar.
  function resolver(Px, Py, lo, hi, depth) {
    const n = Px.length;

    // caso base: ate 3 pontos, compara todos os pares direto
    if (n <= 3) {
      let best = null;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          comps++;
          const d = distancia(Px[i], Px[j]);
          if (eventos) eventos.push({ t: "cmp", a: Px[i], b: Px[j], d, lo, hi, depth, comps });
          if (!best || d < best.d) best = { a: Px[i], b: Px[j], d };
        }
      }
      if (eventos) eventos.push({ t: "base", lo, hi, depth, best, comps });
      return best;
    }

    // dividir: metade dos pontos de cada lado de uma linha vertical
    const m = n >> 1;
    const linha = (Px[m - 1].x + Px[m].x) / 2;
    if (eventos) eventos.push({ t: "divide", lo, hi, x: linha, depth, n, m, comps });

    // separa Py nas duas metades sem reordenar: percorre na ordem de y e
    // manda cada ponto pro lado em que ele ficou em Px
    const idsEsquerda = new Set();
    for (let i = 0; i < m; i++) idsEsquerda.add(Px[i].id);
    const Ly = [];
    const Ry = [];
    for (const p of Py) {
      if (idsEsquerda.has(p.id)) Ly.push(p);
      else Ry.push(p);
    }

    // conquistar: resolve cada lado recursivamente
    const melhorEsquerda = resolver(Px.slice(0, m), Ly, lo, linha, depth + 1);
    const melhorDireita = resolver(Px.slice(m), Ry, linha, hi, depth + 1);

    // combinar: o par mais proximo pode ter um ponto de cada lado. se tiver,
    // os dois estao a menos de delta da linha.
    let best = melhorEsquerda.d <= melhorDireita.d ? melhorEsquerda : melhorDireita;
    const delta = best.d;
    const faixa = Py.filter(p => Math.abs(p.x - linha) < delta);
    const idsFaixa = eventos ? faixa.map(p => p.id) : null;
    if (eventos) eventos.push({ t: "strip", lo, hi, x: linha, delta, ids: idsFaixa, depth, best, comps });

    // na faixa (ordenada por y), cada ponto so precisa ser comparado com os
    // seguintes que estao a menos de delta em y -- no maximo 7 deles
    for (let i = 0; i < faixa.length; i++) {
      for (let j = i + 1; j < faixa.length && faixa[j].y - faixa[i].y < best.d; j++) {
        comps++;
        const d = distancia(faixa[i], faixa[j]);
        const melhor = d < best.d;
        if (melhor) best = { a: faixa[i], b: faixa[j], d };
        if (eventos) eventos.push({ t: "scmp", a: faixa[i], b: faixa[j], d, melhor, lo, hi, x: linha, delta, ids: idsFaixa, depth, comps });
      }
    }

    if (eventos) eventos.push({ t: "merge", lo, hi, depth, best, comps });
    return best;
  }

  const best = resolver(Px, Py, 0, LARGURA_MAPA, 0);
  return { best, comps };
}
