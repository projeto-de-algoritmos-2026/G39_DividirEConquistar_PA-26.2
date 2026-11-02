const LARGURA_MAPA = 800;

function distancia(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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

function parMaisProximo(pontos, eventos = null) {
  let comps = 0;
  if (pontos.length < 2) return { best: null, comps };

  const Px = [...pontos].sort((a, b) => a.x - b.x || a.y - b.y || a.id - b.id);
  const Py = [...pontos].sort((a, b) => a.y - b.y || a.x - b.x || a.id - b.id);

  function resolver(Px, Py, lo, hi, depth) {
    const n = Px.length;

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

    const m = n >> 1;
    const linha = (Px[m - 1].x + Px[m].x) / 2;
    if (eventos) eventos.push({ t: "divide", lo, hi, x: linha, depth, n, m, comps });

    const idsEsquerda = new Set();
    for (let i = 0; i < m; i++) idsEsquerda.add(Px[i].id);
    const Ly = [];
    const Ry = [];
    for (const p of Py) {
      if (idsEsquerda.has(p.id)) Ly.push(p);
      else Ry.push(p);
    }

    const melhorEsquerda = resolver(Px.slice(0, m), Ly, lo, linha, depth + 1);
    const melhorDireita = resolver(Px.slice(m), Ry, linha, hi, depth + 1);

    let best = melhorEsquerda.d <= melhorDireita.d ? melhorEsquerda : melhorDireita;
    const delta = best.d;
    const faixa = Py.filter(p => Math.abs(p.x - linha) < delta);
    const idsFaixa = eventos ? faixa.map(p => p.id) : null;
    if (eventos) eventos.push({ t: "strip", lo, hi, x: linha, delta, ids: idsFaixa, depth, best, comps });

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
