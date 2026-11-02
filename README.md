# G39_DividirEConquistar_PA-26.2

## O problema: par de pontos mais próximos

Dado um conjunto de **n pontos no plano**, encontrar os **dois pontos mais próximos** entre si (menor distância euclidiana).

No jogo, cada ponto é uma personagem estacionada no mapa, e o par mais próximo é a resposta que o jogador tenta encontrar a olho.

### Por que dividir e conquistar?

A solução direta é a **força bruta**: calcular a distância de todos os pares e ficar com a menor. São `n(n−1)/2` pares, ou seja, **O(n²)**. Com 5.000 pontos, isso dá 12,5 milhões de distâncias.

O algoritmo de **dividir e conquistar** resolve o mesmo problema em **O(n log n)**. Ele divide os pontos ao meio, resolve cada metade sozinha e, na hora de juntar, só olha para os pontos perto da linha que separou as metades. Com 5.000 pontos, ele calcula cerca de 6.400 distâncias.

---

## Arquivos do algoritmo

| Arquivo | Para que serve |
| --- | --- |
| `par-mais-proximo.js` | `parMaisProximo` (dividir e conquistar) e `forcaBruta` (gabarito). |
| `testes.html` | Compara os dois algoritmos em mais de 500 conjuntos de pontos. Basta abrir no navegador. |
| `animacao.js` | Aba "Ver o algoritmo": reproduz cada passo da recursão no mapa. |
| `benchmark.js` | Aba "Desempenho": mede comparações e tempo dos dois algoritmos. |

As duas funções recebem uma lista de pontos `{ id, x, y }` e devolvem `{ best: { a, b, d }, comps }`: o par mais próximo, a distância entre eles e quantas distâncias foram calculadas.

---

## Como o algoritmo funciona

**Antes da recursão**, os pontos são ordenados **uma única vez** de dois jeitos: por x (`Px`) e por y (`Py`).

Depois, a função recursiva recebe `Px` e `Py` de uma região e faz:

1. **Caso base.** Se a região tem até 3 pontos, compara todos os pares direto.
2. **Dividir.** Pega o ponto do meio de `Px` e traça uma linha vertical ali. Metade dos pontos fica à esquerda e metade à direita. `Py` é separado nas duas metades percorrendo-o em ordem, então cada metade continua ordenada por y **sem precisar ordenar de novo**.
3. **Conquistar.** Resolve a esquerda e a direita recursivamente. Seja `δ` a menor das duas distâncias encontradas.
4. **Combinar.** O par mais próximo pode ter um ponto de cada lado da linha. Se tiver, a distância dele é menor que `δ`, então os dois pontos estão a menos de `δ` da linha. Monta-se a **faixa** com os pontos a menos de `δ` da linha (já ordenados por y, porque vêm de `Py`). Para cada ponto da faixa, compara-se só com os pontos seguintes cuja diferença em y é menor que `δ`.

O resultado da região é o melhor entre a esquerda, a direita e a faixa.

### Detalhes que importam

- **Ordenar uma vez só.** Se cada chamada ordenasse a faixa por y, a combinação custaria O(n log n) e a recorrência viraria `T(n) = 2T(n/2) + O(n log n)`, que dá **O(n log² n)**. Separando o `Py` já ordenado, a combinação fica em O(n).
- **Pontos com o mesmo x.** A ordenação desempata por y e depois por id. A separação de `Py` usa os ids da metade esquerda de `Px`, não a coordenada x, então pontos em cima da linha nunca vão para os dois lados nem somem.
- **Pontos repetidos.** Se dois pontos estão no mesmo lugar, `δ = 0`, a faixa fica vazia e o algoritmo devolve distância 0, como esperado.

---

## Complexidade

Em cada chamada com n pontos:

| Etapa | Custo |
| --- | --- |
| Dividir `Px` e separar `Py` | O(n) |
| Duas chamadas recursivas | 2 · T(n/2) |
| Montar a faixa e comparar cada ponto com no máximo 7 vizinhos | O(n) |

Isso dá a recorrência

```
T(n) = 2T(n/2) + O(n)
```

que é a mesma do mergesort. A árvore de recursão tem `log n` níveis, e cada nível faz O(n) de trabalho no total, então **T(n) = O(n log n)**. Somando a ordenação inicial, que também é O(n log n), o algoritmo inteiro é **O(n log n)**.

### Por que cada ponto da faixa compara com no máximo 7 vizinhos

Esse é o argumento que garante que a combinação é linear.

Pegue um ponto `p` da faixa. Os únicos pontos que podem estar a menos de `δ` dele, acima dele na ordem de y, ficam dentro de um retângulo de largura `2δ` (a faixa inteira) e altura `δ`, começando na altura de `p`.

Divida esse retângulo em **8 quadrados de lado δ/2**: 4 do lado esquerdo da linha e 4 do lado direito.

- A diagonal de cada quadrado mede `δ/√2`, que é **menor que δ**.
- Então, se dois pontos estivessem no mesmo quadrado, a distância entre eles seria menor que `δ`. Mas os dois estariam do mesmo lado da linha, e `δ` já é a menor distância entre pontos de um mesmo lado. Contradição.
- Logo, **cada quadrado tem no máximo 1 ponto**, e o retângulo tem no máximo 8 pontos, contando o próprio `p`.

Portanto, cada ponto da faixa é comparado com **no máximo 7** pontos seguintes. No código, isso aparece na condição do laço interno: ele para assim que a diferença em y chega a `δ`.

```js
for (let j = i + 1; j < faixa.length && faixa[j].y - faixa[i].y < best.d; j++)
```

---

## Desempenho medido

Números de uma execução do `benchmark.js` com pontos aleatórios (os tempos variam com a máquina e o navegador; as comparações variam pouco entre execuções):

| Pontos | Comparações força bruta | Comparações D&C | Vezes menos | Tempo força bruta | Tempo D&C |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 45 | 9 | 5,0× | 0,12 ms | 0,40 ms |
| 100 | 4.950 | 141 | 35,1× | 1,68 ms | 0,38 ms |
| 1.000 | 499.500 | 1.157 | 431,7× | 1,63 ms | 2,91 ms |
| 2.000 | 1.999.000 | 2.272 | 879,8× | 6,84 ms | 3,20 ms |
| 5.000 | 12.497.500 | 6.365 | 1.963,5× | 42,17 ms | 8,09 ms |

- O número de comparações da força bruta é exatamente `n(n−1)/2`. O do dividir e conquistar cresce pouco mais que linearmente: pouco mais de 1 comparação por ponto.
- Com poucos pontos, a força bruta pode até ser mais rápida em tempo, porque o dividir e conquistar paga o custo de ordenar e de criar as listas de cada chamada. A vantagem aparece conforme n cresce: com 5.000 pontos, o D&C faz quase 2.000 vezes menos comparações.
- Na aba "Desempenho", o gráfico usa escala logarítmica nos dois eixos. Nela, `n²` e `n log n` aparecem como retas de inclinações diferentes.

---

## Testes

Abra `testes.html` no navegador. A página roda os dois algoritmos e confere que encontram a mesma distância em:

- **10 casos especiais:** 2 pontos, 3 pontos, 4 pontos, todos com o mesmo x, todos com o mesmo y, pontos repetidos, todos no mesmo lugar, grade regular 10 × 10, par mais próximo cruzando a primeira divisão e pontos em diagonal;
- **500 conjuntos aleatórios** de 2 a 2.000 pontos, metade com coordenadas inteiras num intervalo pequeno, para forçar empates de x, de y e pontos repetidos.

Se algum caso falhar, a página mostra os pontos daquele caso para reproduzir o erro.
