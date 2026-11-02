# Vizinhas de Pista

**Grupo:** G39<br>
**Conteúdo da disciplina:** Dividir e Conquistar

## Alunos

| Matrícula | Aluno |
| :---: | :--- |
| 231026680 | Cibelly Lourenço |
| 211039500 | Isabelle da Costa |

## Sobre

**Vizinhas de Pista** é um jogo sobre o problema do **par de pontos mais próximos**. Um grupo de amigas estacionou espalhado pelo mapa, e a missão do jogador é descobrir quais duas pararam mais perto uma da outra. Com dezenas de personagens na tela, o olho engana, e o algoritmo de dividir e conquistar mostra a resposta certa.

O site tem três abas:

1. **Jogar:** o jogador clica nas duas amigas que acha mais próximas, contra o relógio. No fim, o jogo mostra o par escolhido, o par certo, as distâncias e quantas comparações o algoritmo fez em relação à força bruta.
2. **Ver o algoritmo:** a recursão passo a passo no mapa: a linha que divide os pontos ao meio, os casos base, a faixa de largura 2δ em volta da linha e o melhor par de cada região. Dá para reproduzir, pausar, avançar e voltar.
3. **Desempenho:** mede, para 10 a 5.000 pontos, quantas distâncias e quanto tempo a força bruta e o dividir e conquistar gastam, com tabela e gráfico.

## Como rodar

Não precisa instalar nada. Basta clonar o repositório e abrir o `index.html` no navegador (dois cliques no arquivo):

```bash
git clone https://github.com/projeto-de-algoritmos-2026/G39_DividirEConquistar_PA-26.2.git
cd G39_DividirEConquistar_PA-26.2
```

Para rodar os testes do algoritmo, abra o `testes.html` do mesmo jeito.

## Como jogar

1. Na aba **Jogar**, escolha quantas amigas aparecem no mapa (20, 35 ou 60).
2. Clique nas duas que você acha que estão mais perto. Clicar de novo numa já escolhida desmarca.
3. Ao escolher a segunda, o cronômetro para e o jogo mostra o seu par (linha amarela tracejada) e o par mais próximo (linha verde).
4. Clique em **Nova rodada** para jogar de novo com outras posições.
5. Na aba **Ver o algoritmo**, aperte **Reproduzir** para ver como o algoritmo chegou na resposta.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | Página do jogo, com as três abas. |
| `style.css` | Cores, fontes e layout. As cores do mapa também vêm daqui. |
| `par-mais-proximo.js` | `parMaisProximo` (dividir e conquistar) e `forcaBruta` (gabarito). |
| `desenho.js` | Funções de desenho no canvas: mapa, personagens e linhas entre pares. |
| `jogo.js` | Aba "Jogar": pontos aleatórios, cliques, cronômetro e resultado. |
| `animacao.js` | Aba "Ver o algoritmo": reproduz cada passo da recursão no mapa. |
| `benchmark.js` | Aba "Desempenho": mede comparações e tempo dos dois algoritmos. |
| `testes.html` | Compara os dois algoritmos em mais de 500 conjuntos de pontos. |

---

## O problema: par de pontos mais próximos

Dado um conjunto de **n pontos no plano**, encontrar os **dois pontos mais próximos** entre si (menor distância euclidiana).

No jogo, cada ponto é uma personagem estacionada no mapa, e o par mais próximo é a resposta que o jogador tenta encontrar a olho.

### Por que dividir e conquistar?

A solução direta é a **força bruta**: calcular a distância de todos os pares e ficar com a menor. São `n(n−1)/2` pares, ou seja, **O(n²)**. Com 5.000 pontos, isso dá 12,5 milhões de distâncias.

O algoritmo de **dividir e conquistar** resolve o mesmo problema em **O(n log n)**. Ele divide os pontos ao meio, resolve cada metade sozinha e, na hora de juntar, só olha para os pontos perto da linha que separou as metades. Com 5.000 pontos, ele calcula cerca de 6.400 distâncias.

---

## Interface do algoritmo

As duas funções de `par-mais-proximo.js` recebem uma lista de pontos `{ id, x, y }` e devolvem `{ best: { a, b, d }, comps }`: o par mais próximo, a distância entre eles e quantas distâncias foram calculadas.

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
