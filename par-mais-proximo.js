// par de pontos mais proximos, por forca bruta e por dividir e conquistar.
// ponto = { id, x, y }
// as duas funcoes devolvem { best: { a, b, d }, comps }: o par, a distancia
// entre eles e quantas distancias foram calculadas

// so usado pra animacao saber onde comeca e termina a primeira regiao
const LARGURA_MAPA = 800;

// sem Math.hypot porque ele e bem mais lento, e na forca bruta com 5000 pontos
// essa funcao roda 12,5 milhoes de vezes
function distancia(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// compara todo mundo com todo mundo: n(n-1)/2 distancias, O(n^2)
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
// se receber um array em "eventos", vai guardando cada passo nele (pra animacao)
function parMaisProximo(pontos, eventos = null) {
  let comps = 0;
  if (pontos.length < 2) return { best: null, comps };

  // ordena por x e por y uma vez so, aqui fora. se ordenasse dentro da
  // recursao ficaria O(n log^2 n).
  // o desempate por y e id e pra pontos com o mesmo x nao darem problema na divisao
  const Px = [...pontos].sort((a, b) => a.x - b.x || a.y - b.y || a.id - b.id);
  const Py = [...pontos].sort((a, b) => a.y - b.y || a.x - b.x || a.id - b.id);

  // Px e Py sao os pontos da regiao atual, ordenados por x e por y.
  // lo e hi (limites da regiao em x) so servem pra animacao
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

    // separa o Py em esquerda e direita sem ordenar de novo: vai na ordem
    // de y e coloca cada ponto no lado em que ele caiu no Px
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

    // combinar: pode ser que o par mais proximo tenha um ponto de cada lado.
    // se tiver, os dois estao a menos de delta da linha
    let best = melhorEsquerda.d <= melhorDireita.d ? melhorEsquerda : melhorDireita;
    const delta = best.d;
    const faixa = Py.filter(p => Math.abs(p.x - linha) < delta);
    const idsFaixa = eventos ? faixa.map(p => p.id) : null;
    if (eventos) eventos.push({ t: "strip", lo, hi, x: linha, delta, ids: idsFaixa, depth, best, comps });

    // a faixa ja esta ordenada por y. cada ponto so compara com os proximos
    // que estao a menos de delta em y (no maximo 7, explicado no README)
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
