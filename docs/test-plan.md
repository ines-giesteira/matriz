# Matriz — Plano de testes

Versão 0.7 · 8 de novembro de 2026 · cenários essenciais das tarefas e das respetivas permissões; a 0.2 acrescenta os testes unitários da validação do título (secção 5); a 0.3, os testes de integração de criação e consulta (secção 6); a 0.4, o teste End-to-End de criação (secção 7); a 0.5, os testes de segurança na cobertura do TP-05 e do TP-06 (Exercício 5); a 0.6 acrescenta os testes de componentes do frontend (secção 8, CR-01) e atualiza as decisões do título (CR-02) e do E2E (CR-04); a 0.7 acrescenta o nível E2E à legenda e ao TP-02, corrige a descrição da limpeza das bases do E2E (P40) e regista a execução final (secção 9).

> **Estado:** seleção dos cenários essenciais de tarefas: título inválido, criação e consulta, e acesso sem autorização. Todos têm teste automático de integração; todos menos o TP-04 têm verificação manual registada. O TP-01 tem também testes unitários e o TP-02 um teste End-to-End. As decisões e a revisão das sugestões da IA estão na secção 4 (Ficha 4, Exercício 1); os testes unitários e os seus resultados, na secção 5 (Exercício 2); os testes de integração de criação e consulta, na secção 6 (Exercício 3); o teste End-to-End, na secção 7 (Exercício 4); os testes de componentes do frontend, na secção 8; a execução final de todos os testes, na secção 9.

**Fontes:** [requirements.md](requirements.md) (matriz de permissões, secção 3; RF-09, RF-15), [user-stories.md](user-stories.md) (US-11, US-17; CA e EC), [`openapi.yaml`](../openapi.yaml) (códigos de erro e ordem de verificação, RV-25), [implementation-plan.md](implementation-plan.md) (estratégia de testes, secção 5) e [verification.md](verification.md) (casos 03, 04 e 08).

## 1. Legenda

**Atores:**
- **Gestor:** Gestor do projeto.
- **Membro:** membro do projeto que não é responsável pela tarefa.
- **Não membro:** Gestor de outro projeto ou Administrador, que nunca é membro (RV-32).

**Níveis de teste** ([implementation-plan.md](implementation-plan.md), secção 5):
- **U:** unitário (Vitest), para regras puras.
- **I:** integração da API (Vitest e Supertest, com uma base SQLite temporária).
- **E2E:** End-to-End pela interface (Playwright, com o backend e uma base temporária própria; secção 7).
- **M:** manual, no navegador e com pedidos diretos à API ([verification.md](verification.md)).

Os caminhos são relativos a `/api/projetos/{p}`, em que `{p}` é o projeto e `{t}` a tarefa.

## 2. Cenários essenciais

| # | Cenário | Ator | Entradas | Resultado esperado | Nível | Ref. |
|---|---|---|---|---|---|---|
| TP-01 | Título inválido | Gestor | `POST /tarefas` com `titulo` igual a `""`, `"   "` ou com 201 caracteres | 422 `TITULO_OBRIGATORIO` / `LIMITE_EXCEDIDO`; nenhuma tarefa é criada; a interface mantém os dados e não mostra sucesso | U + I + M | EC-01, EC-02, EC-29, EC-50 |
| TP-02 | Criar só com o título | Gestor | `POST /tarefas {titulo}` | 201; `TODO`, `MEDIUM`, sem responsáveis; aparece na lista e as contagens sobem 1 | I + E2E + M | CA-11.1, CA-11.5 |
| TP-03 | Criar e consultar depois | Gestor | `POST /tarefas` com todos os campos, depois `GET /tarefas/{t}` | O `GET` devolve os mesmos valores, com estado `TODO`; mantém-se depois de reiniciar o backend | I + M | CA-11.2, RNF-09 |
| TP-04 | Consultar uma tarefa de outro membro | Membro | `GET /tarefas/{t}` de uma tarefa de que não é responsável | 200; lê a descrição, mas não a pode editar | I | CA-17.2 |
| TP-05 | Criar sem permissão | Membro | `POST /tarefas {titulo}` no seu projeto | 403 `SEM_PERMISSAO`; nenhuma tarefa é criada; a interface não mostra o botão | I + M | EC-05 |
| TP-06 | Acesso de quem não é membro | Não membro | `GET`, `PATCH` ou `POST` com `{p}` ou `{t}` de outro projeto, também trocando os identificadores | 404 `NAO_ENCONTRADO`, sem revelar se a tarefa existe; os dados ficam iguais | I | EC-18, RV-32 |

## 3. Cobertura

| # | Testes automáticos (`backend/testes/tarefas.test.ts`, salvo indicação) | Verificação manual ([verification.md](verification.md); casos da secção 6.2, salvo indicação) |
|---|---|---|
| TP-01 | Unitários: os 5 testes de `validacao-tarefa.test.ts` (secção 5). Integração: "EC-01, EC-02: título vazio ou só com espaços é recusado (regra de validação)"; "EC-29: título acima de 200 e descrição acima de 5000 caracteres são recusados" | Caso 04 |
| TP-02 | "CA-11.1: só com o título: "Por fazer", prioridade Média, sem responsáveis, e aparece na lista"; "CA-11.5: as contagens do projeto refletem a nova tarefa". E2E: "CA-01.1, CA-11.1, CA-11.5: a Gestora entra, cria uma tarefa e vê-a na lista do projeto" (`e2e/criar-tarefa.spec.ts`, secção 7) | Caso 03 |
| TP-03 | "CA-11.2: com todos os campos; os valores ficam guardados (persistência)"; em `integracao-tarefa.test.ts`, "CA-11.2, CA-17.2: o Gestor cria com 201 e a tarefa é devolvida igual ao Gestor e a um membro" (secção 6) | Caso 03 (reinício do backend) |
| TP-04 | "CA-17.2: um membro lê a descrição de uma tarefa de que não é responsável" (leitura); "CA-14.3: um Membro não altera a descrição de uma tarefa de que não é responsável" (edição recusada) | — |
| TP-05 | "EC-05: um Membro recebe 403 e um Gestor de outro projeto recebe 404 (autorização)"; em `seguranca-acessos.test.ts`, "V01-V09: a Marta (Membro) não faz ações de Gestor nem de Administrador" | Caso 08 (API); passo M1 da secção 2.3 (sem ações de gestão na interface) |
| TP-06 | "EC-18: uma tarefa de outro projeto não é encontrada, mesmo mudando o identificador do projeto"; "D-05: não lê, não cria nem elimina tarefas (404)"; em `seguranca-acessos.test.ts`, "H01-H14" e "H16-H19" ([quality-security-review.md](quality-security-review.md), secção 3) | Caso 08 |

Para correr o ficheiro que contém estes testes (inclui os outros testes de tarefas):

```bash
npx vitest run --root backend testes/tarefas.test.ts
```

## 4. Decisões e revisão

### 4.1 Seleção dos cenários

A IA propôs uma matriz de 26 cenários para tarefas e permissões (criação, consulta, filtros, edição, estado, responsáveis, eliminação, comentários, projeto arquivado e sessão), com os resultados esperados tirados dos CA e EC de [user-stories.md](user-stories.md) e do contrato [`openapi.yaml`](../openapi.yaml), e não do comportamento atual do código. Desses, ficaram neste plano os 6 que o enunciado considera essenciais:

| Decisão | Justificação |
|---|---|
| TP-01: título vazio, só com espaços e acima do limite | Cobre o campo obrigatório (EC-01), a regra de Q-01 (EC-02) e o valor-limite de A-20 (EC-29) numa só regra; é a base do Exercício 2. |
| TP-02 e TP-03: criar só com o título e com todos os campos, e consultar depois | Verificam os valores por omissão (A-19, CA-11.4) e que o que se guarda é o que se lê (CA-11.2, RNF-09); é a base do Exercício 3. |
| TP-04: consultar a tarefa de outro membro | Completa a consulta com o lado das permissões: qualquer membro lê, mas só o responsável edita (RV-17, CA-14.3). |
| TP-05: Membro tenta criar | Utilizador autenticado e membro do projeto, mas sem o papel necessário: 403 (D-11). |
| TP-06: quem não é membro, incluindo o Administrador | Acesso a recursos de outro projeto trocando os identificadores (IDOR): 404, sem revelar se existem (D-10, RV-32); prepara o Exercício 5. |

Os restantes 20 cenários (filtros, estado, responsáveis, eliminação, comentários e sessão) ficam fora deste plano por não fazerem parte da seleção pedida; continuam cobertos pelos testes de `tarefas.test.ts`, `responsaveis-comentarios.test.ts`, `membros.test.ts` e `sessao.test.ts`.

### 4.2 Sugestões da IA revistas e corrigidas

| # | Ponto revisto | Revisão | Decisão |
|---|---|---|---|
| 1 | Código devolvido ao Administrador nas tarefas: 403 (gere todos os projetos) ou 404? | Pressuposto a confirmar antes de o registar. RV-32: o Administrador nunca é membro, por isso recebe 404, como quem não pertence ao projeto. Confirmado no teste "D-05: não lê, não cria nem elimina tarefas (404)" | TP-06 indica 404 também para o Administrador. |
| 2 | Matriz: num projeto arquivado, quem tem permissão recebe 409 e quem não tem recebe 403 (ordem de RV-25) | Correto face ao contrato, mas a revisão da cobertura mostrou que só o 409 do Gestor tinha teste | Acrescentado o teste "EC-16, EC-05, EC-12: num projeto arquivado, um Membro recebe 403 e o Gestor 409" em `tarefas.test.ts`. |
| 3 | TP-01 com nível unitário | Não existe teste unitário da validação do título; só o teste de integração com Supertest | Nível corrigido para I + M; o teste unitário fica para o Exercício 2. Resolvido na versão 0.2 (secção 5). |
| 4 | TP-04 coberto só pelo teste CA-17.2 | Esse teste verifica a leitura, mas não a recusa da edição | Acrescentado à cobertura o teste CA-14.3. |
| 5 | TP-05 verificado na interface pelo caso 08 | O caso 08 só usou pedidos à API; a ausência das ações na interface está no passo M1 da secção 2.3 de [verification.md](verification.md) | Cobertura manual corrigida. |
| 6 | O comando da secção 3 correria "só estes testes" | Corre o ficheiro inteiro (41 testes, todos a passar a 5 de novembro de 2026) | Texto corrigido. |

### 4.3 Pressupostos por aprovar

- A série de IDs TP-xx é nova e serve só para identificar os cenários deste plano.
- O nome do ficheiro (`test-plan.md`) segue o enunciado da Ficha 4, embora o conteúdo esteja em português.

## 5. Testes unitários da validação do título (Ficha 4, Exercício 2)

### 5.1 Regra escolhida

A validação do título da tarefa, na função `validarDados` de `backend/src/modulos/tarefas/servico.ts` (RF-09, Q-01, A-20; EC-01, EC-02, EC-29). É uma regra pura, sem base de dados, e corresponde ao TP-01 deste plano.

A função não era exportada, por isso só se testava através da API. Com autorização, passou a ser exportada (`export function validarDados`); o comportamento não mudou.

### 5.2 Testes

Ficheiro `backend/testes/validacao-tarefa.test.ts` (Vitest). Os resultados esperados vêm dos requisitos, não da implementação.

| Tipo | Teste | Entrada | Resultado esperado | Resultado |
|---|---|---|---|---|
| Válido | "RF-09: um título preenchido é aceite" | `"Preparar reunião de arranque"` | Aceite | Passa |
| Inválido | "EC-01: um título vazio é recusado com 422 TITULO_OBRIGATORIO" | `""` | 422 `TITULO_OBRIGATORIO`, `campo: titulo` | Passa |
| Inválido | "EC-02: um título só com espaços conta como vazio (Q-01)" | `"   "` | 422 `TITULO_OBRIGATORIO`, `campo: titulo` | Passa |
| Limite | "EC-29: o valor-limite de 200 caracteres é aceite (A-20)" | 200 vezes `a` | Aceite; `LIMITE_TITULO` é 200 | Passa |
| Limite | "EC-29: 201 caracteres são recusados com 422 LIMITE_EXCEDIDO e o limite indicado" | 201 vezes `a` | 422 `LIMITE_EXCEDIDO`, `campo: titulo`, `limite: 200` | Passa |

```bash
npx vitest run --root backend testes/validacao-tarefa.test.ts
```

Execução de 5 de novembro de 2026: 5 testes, todos a passar. `npm test`: 10 ficheiros e 240 testes, todos a passar; `npm run typecheck -w backend` e `npm run build` sem erros.

### 5.3 As asserções verificam os requisitos?

Para confirmar que os testes falham quando a regra está errada, a regra foi alterada temporariamente de três formas e os testes foram corridos com cada alteração. No fim, o ficheiro foi reposto: a única diferença face ao commit anterior é o `export`.

| Alteração temporária à regra | Requisito violado | Testes que falharam |
|---|---|---|
| Sem `trim()`: só espaços deixa de contar como vazio | Q-01, EC-02 | EC-02 |
| `>` passa a `>=`: 200 caracteres passam a ser recusados | A-20, EC-29 | EC-29 (200 aceite) |
| `LIMITE_TITULO` passa a 201 | A-20, EC-29 | EC-29 (200 aceite, pela verificação da constante) e EC-29 (201 recusado) |

Todas as alterações foram detetadas. A regra não foi alterada para obter testes verdes.

### 5.4 Revisão e decisões

| # | Ponto | Decisão |
|---|---|---|
| 1 | O caso válido citava o CA-11.1, que trata da criação pela API (estado, prioridade e responsáveis), e não da validação | Teste renomeado para RF-09, que define a regra do título. |
| 2 | Testar os dois lados do limite (200 e 201) | Mantido: só assim se deteta um `>=` no lugar de `>` (secção 5.3). |
| 3 | O valor-limite usa só letras | O título é validado e guardado sem retirar os espaços das pontas, e a documentação não diz se contam para o limite; o teste não depende disso. |

**Decidido a 8 de novembro de 2026 (CR-02, P38):** o título guarda-se sem espaços nas pontas e o limite de 200 caracteres conta-se depois, como no nome do projeto. `validarDados` continua a receber o título já sem espaços nas pontas; o teste de integração `CR-02, P38` (`integracao-tarefa.test.ts`) verifica a criação e a edição.

## 6. Testes de integração: criar e consultar uma tarefa (Ficha 4, Exercício 3)

### 6.1 Testes

Ficheiro `backend/testes/integracao-tarefa.test.ts` (Vitest e Supertest), sobre a aplicação Express real e os caminhos e campos de [`openapi.yaml`](../openapi.yaml). Atores do seed: a Ana, Gestora de "Lançamento do novo site", e a Marta, membro do mesmo projeto.

| Tipo | Teste | Entradas | Resultado esperado | Resultado |
|---|---|---|---|---|
| Fluxo | "CA-11.2, CA-17.2: o Gestor cria com 201 e a tarefa é devolvida igual ao Gestor e a um membro" | Ana: `POST /api/projetos/{p}/tarefas` com título, descrição, a Marta como responsável, `HIGH` e `2026-11-30`; depois `GET /api/projetos/{p}/tarefas/{id}` pela Ana e pela Marta | `POST` 201 com todos os campos do schema `Tarefa` (estado `TODO`, `emAtraso` falso); na base, a linha de `tarefa` com os mesmos valores e a atribuição da Marta em `atribuicao`; `GET` 200 com a mesma tarefa, para o Gestor e para o membro (RV-17) | Passa |
| Negativo | "EC-02: um título só com espaços dá 422 TITULO_OBRIGATORIO e nada é guardado" | Ana: `POST` com `titulo: "   "` | 422 `TITULO_OBRIGATORIO`, `campo: titulo`; o número de tarefas na base não muda | Passa |
| Negativo | "EC-11, EC-18: uma tarefa que não existe dá 404 NAO_ENCONTRADO" | Ana: `GET /api/projetos/{p}/tarefas/999999` | 404 `NAO_ENCONTRADO` | Passa |

```bash
npx vitest run --root backend testes/integracao-tarefa.test.ts
```

### 6.2 As asserções verificam os requisitos?

O código de produção foi alterado temporariamente de três formas, e os testes foram corridos com cada alteração. No fim, os dois ficheiros foram repostos e o `git status` confirmou que ficaram sem alterações.

| Alteração temporária | Testes que falharam |
|---|---|
| `inserirTarefa` não guarda a descrição | Fluxo (a linha na base e as respostas da API diferem) |
| `inserirTarefa` não guarda os responsáveis | Fluxo |
| A validação do título deixa de usar `trim()` | EC-02: a base de dados recusa o título pela sua restrição `CHECK`, mas a API deixa de responder 422 |

### 6.3 Base de dados de teste e isolamento

- **Base de teste:** cada teste abre uma base SQLite nova em memória (`abrirBd(':memory:')`), aplica as migrations e os dados de demonstração (`beforeEach`), e fecha-a no fim (`afterEach`). A aplicação recebe essa base, por isso não lê `CAMINHO_BD` nem toca na base de desenvolvimento.
- **Limpeza:** como a base é descartada a cada teste, nenhum dado passa de um teste para outro nem de uma execução para a seguinte; não é precisa limpeza manual.
- **Data:** o dia de hoje é fixado em 29/10/2026, para que `emAtraso` não dependa do dia em que se corre o teste (A-08).

Execuções de 8 de novembro de 2026:

| Execução | Resultado |
|---|---|
| Duas vezes seguidas | 3 testes a passar em ambas |
| Ordem aleatória (`--sequence.shuffle`, sementes 1 e 42) | 3 testes a passar em ambas |
| Cada teste sozinho (`-t "CA-11.2"`, `-t "EC-02"`, `-t "EC-11"`) | Cada um passa sem os outros |
| Ficheiros SQLite ou pasta `dados/` criados no repositório | Nenhum |
| `npm test` | 11 ficheiros e 243 testes, todos a passar; `npm run typecheck -w backend` sem erros |

### 6.4 Decisões

| # | Ponto | Decisão |
|---|---|---|
| 1 | O teste "CA-11.2" de `tarefas.test.ts` já criava e consultava, mas não verificava os códigos HTTP nem todos os campos | Teste novo e próprio para o exercício, sem alterar o existente. |
| 2 | A persistência só era verificada através da API | O teste lê também as tabelas `tarefa` e `atribuicao`, para não depender só da resposta da própria API. |
| 3 | Persistência depois de reiniciar o backend | Fica fora deste teste, que usa uma base em memória; está coberta por `bd.test.ts` ("persistência em ficheiro (RNF-09)") e pelo caso manual 03 de [verification.md](verification.md). |
| 4 | Dois cenários negativos em vez de um | Um de validação (422) e um de recurso inexistente (404), os dois exemplos do enunciado. |

## 7. Teste End-to-End: criar uma tarefa pela interface (Ficha 4, Exercício 4)

### 7.1 Ferramenta e ambiente

- **Playwright** (`@playwright/test` 1.64.1, dependência de desenvolvimento na raiz, versão fixa). Não havia ferramenta E2E no projeto; a dependência foi aprovada antes de ser acrescentada. Escolheu-se a 1.64.1 em vez da 1.65.0, publicada três dias antes, por estar disponível há mais tempo.
- **Navegador:** o Microsoft Edge instalado no sistema (`channel: 'msedge'`), para não descarregar navegadores (`playwright install` não foi usado).
- **Arranque** (`playwright.config.ts`): o Playwright arranca o backend na porta 3100 (`bd:migrar`, `bd:seed` e `dev -w backend`) e a interface na porta 5174, e para-os no fim. As portas não chocam com um `npm run dev` (3000 e 5173).
- **Dados isolados:** cada execução usa uma base SQLite nova na pasta temporária do sistema (`matriz-e2e-<instante>.sqlite`), com os dados de demonstração e uma palavra-passe de teste fictícia (`e2e/dados.ts`). A base de desenvolvimento não é usada e não é preciso `.env`. O caminho da base é gerado em cada execução; um `MATRIZ_E2E_BD` que venha do ambiente é ignorado. Antes de cada execução, `e2e/limpar-bases.ts` apaga as bases `matriz-e2e-*` com mais de um dia; as mais recentes ficam, porque podem ser de outra execução a decorrer ao mesmo tempo ou servir para diagnóstico (P40).

```bash
npm run test:e2e
```

### 7.2 Teste

Ficheiro `e2e/criar-tarefa.spec.ts`: "CA-01.1, CA-11.1, CA-11.5: a Gestora entra, cria uma tarefa e vê-a na lista do projeto".

| Passo | Ação | Verificação |
|---|---|---|
| 1. Autenticar | Email e palavra-passe da Ana; "Entrar" | Título "Olá, Ana Silva" no painel (CA-01.1) |
| 2. Abrir o projeto | Ligação "Lançamento do novo site" | Título "Tarefas (10)" (seed de CA-18.1) |
| 3. Criar a tarefa | "Nova tarefa"; Título "Rever acessibilidade do formulário de contacto"; "Criar tarefa" | Mensagem `Tarefa "…" criada.` |
| 4. Verificar na lista | — | "Tarefas (11)" sem recarregar (CA-11.5); a linha da tarefa existe e está "Por fazer" (CA-11.1) |
| 5. Recarregar | `page.reload()` | "Tarefas (11)" e a tarefa continuam na lista (RNF-09) |

**Seletores:** só por papel e nome acessível (`getByRole`, `getByLabel`), com os textos e os rótulos que a interface já tinha; não foi preciso alterar o código de produção nem acrescentar `data-testid`. **Esperas:** só as automáticas do Playwright (`expect(...).toBeVisible()`, `toHaveText`), sem esperas fixas. **Diagnóstico:** o trace e o screenshot só são guardados quando o teste falha (`test-results/`, fora do Git).

### 7.3 Resultados

Execuções de 8 de novembro de 2026:

| Execução | Resultado |
|---|---|
| `npm run test:e2e`, cinco vezes | 1 teste a passar em todas (entre 6,7 e 8,2 s cada) |
| Servidores nas portas 3100 e 5174 depois do teste | Nenhum: o Playwright parou-os |
| Ficheiros criados no repositório | Só `test-results/` (no `.gitignore`) |
| Bases temporárias depois de várias execuções | Só as da última execução (três ficheiros: `.sqlite`, `-wal` e `-shm`). Desde o P40, ficam as do último dia (secção 7.4) |

**O teste falha quando a interface está errada?** A mensagem de sucesso em `TarefasProjeto.tsx` foi alterada temporariamente para "Tarefa guardada.". O teste falhou no passo 3 (`expect(locator).toHaveText` sem o texto esperado) e guardou o screenshot, o contexto e o trace. O screenshot confirmou o diagnóstico: a tarefa foi criada e o total passou a 11, só a mensagem era diferente. O ficheiro foi reposto e `git status` confirmou que ficou sem alterações.

### 7.4 Limitações e decisões

| # | Ponto | Decisão |
|---|---|---|
| 1 | O teste depende do Edge instalado no sistema | Aceite para evitar descarregar navegadores. Noutra máquina sem Edge, muda-se `channel` para `chrome` ou corre-se `npx playwright install chromium` e retira-se `channel`. |
| 2 | O backend do E2E usa a data real, porque só os testes de integração fixam o relógio | Não afeta o teste: a tarefa criada não tem data limite, e as verificações não dependem dos atrasos. |
| 3 | O `npm test` não corre o E2E | Mantido à parte (`npm run test:e2e`): precisa de navegador e de arrancar os servidores, e demora mais. |
| 4 | A base do E2E podia vir de `MATRIZ_E2E_BD` do ambiente, e a limpeza apagava as bases de outras execuções (CR-04) | Corrigido (P40): o caminho é gerado em cada execução e um valor do ambiente é ignorado; só se apagam bases com mais de um dia. A regressão foi verificada a correr o E2E com um `MATRIZ_E2E_BD` no ambiente e com bases antigas e recentes na pasta temporária ([quality-security-review.md](quality-security-review.md), secção 8.1). |
| 5 | Os ficheiros de `e2e/` e `playwright.config.ts` não entram no `npm run typecheck -w backend` nem no `build` | O Playwright converte o TypeScript ao correr, por isso um erro de tipos não impede o teste. Verificados à mão a 8 de novembro de 2026 com `tsc --noEmit --strict` (sem erros); fica por decidir se se acrescenta um `tsconfig` próprio. |

## 8. Testes de componentes do frontend (CR-01, P41)

Antes, o frontend não tinha testes automáticos: a proteção contra submissão repetida (EC-51) e a limpeza da mensagem de sucesso (EC-50) só eram verificadas à mão (CR-01, [quality-security-review.md](quality-security-review.md)).

| Ficheiro | Ferramentas | Isolamento |
|---|---|---|
| `frontend/testes/tarefas-projeto.test.tsx` | Vitest, Testing Library e jsdom | A API é simulada por um `fetch` falso; o componente `TarefasProjeto`, a sessão e o cliente HTTP são os reais. Não arranca o backend. |

| Caso | Verifica | Resultado (8/11/2026) |
|---|---|---|
| EC-51 | Duplo clique em "Criar tarefa", com a resposta da API atrasada: um só `POST` e a mensagem de sucesso. | Passa |
| EC-50, P1 | A mensagem de sucesso desaparece quando se muda o estado de uma tarefa. | Passa |
| CR-03, P39 | Mudar o estado de uma tarefa que já não existe (404): a lista recarrega e a linha desaparece. | Passa |

**Os testes falham se o comportamento falhar?** Sim. Cada proteção foi retirada temporariamente do código e o teste correspondente falhou (e só esse): sem o bloqueio de `aEnviar` no formulário, o EC-51; sem limpar a mensagem em `aoIniciar`, o EC-50; sem `aoNaoEncontrar`, o CR-03. Os ficheiros foram repostos com `git checkout`.

**Limitação:** o `fireEvent` despacha os dois cliques um a seguir ao outro, tal como um duplo clique real, mas não reproduz o tempo entre cliques de uma pessoa; o caso manual de [verification.md](verification.md), secção 6.6, continua a complementar o EC-51.

## 9. Execução final

Execução de 8 de novembro de 2026, na revisão de conformidade com as Fichas 1 a 4, numa cópia limpa do repositório (worktree nova, sem `node_modules` nem `.env`), com Node.js 26.13.0. O código é o da tag `entrega-ficha4`.

| Comando | Tipo | Resultado |
|---|---|---|
| `npm install` | Preparação | Concluído; 0 vulnerabilidades e só o aviso do `esbuild` descrito no README |
| `npm test` | Unitários, integração (backend) e componentes (frontend) | Backend: 13 ficheiros e 282 testes; frontend: 1 ficheiro e 3 testes; todos a passar |
| `npm run typecheck -w backend` | Tipos | Sem erros |
| `npm run build` | Tipos do frontend e build | Sem erros (backend e interface) |
| `npm audit` | Dependências | 0 vulnerabilidades |
| `npm run test:e2e` | End-to-End | 1 teste a passar em todas as quatro execuções (duas delas, as verificações de regressão do CR-04, [quality-security-review.md](quality-security-review.md), secção 8.1) |
| `npm run bd:migrar` e `npm run bd:seed`, duas vezes, numa base temporária (`CAMINHO_BD`) | Manual | Migrations 001 a 004 aplicadas uma só vez; o seed recusa correr sem `NODE_ENV=development` e com a palavra-passe do `.env.example`; com outra palavra-passe, cria os dados e, à segunda vez, não altera nada. A base foi apagada no fim |
| `npm run bd:primeiro-admin` na mesma base, já com contas | Manual | Recusado: a primeira conta só se cria numa base vazia (RV-37) |
| Contrato e rotas | Manual | 35 operações no `openapi.yaml` e 35 rotas no backend. Os códigos de erro do backend estão todos no contrato, exceto `ENTRADA_INCOMPLETA` e `JA_EXISTEM_CONTAS`, que só o comando `npm run bd:primeiro-admin` usa |

**Não executado:** nenhum teste do repositório ficou por correr. As verificações que continuam por fazer estão em [quality-security-review.md](quality-security-review.md), secção 8.3.
