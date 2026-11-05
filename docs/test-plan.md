# Matriz — Plano de testes

Versão 0.1 · 5 de novembro de 2026 · cenários essenciais das tarefas e das respetivas permissões

> **Estado:** seleção dos cenários essenciais de tarefas: título inválido, criação e consulta, e acesso sem autorização. Todos têm teste automático de integração; todos menos o TP-04 têm verificação manual registada. As decisões e a revisão das sugestões da IA estão na secção 4 (Ficha 4, Exercício 1).

**Fontes:** [requirements.md](requirements.md) (matriz de permissões, secção 3; RF-09, RF-15), [user-stories.md](user-stories.md) (US-11, US-17; CA e EC), [`openapi.yaml`](../openapi.yaml) (códigos de erro e ordem de verificação, RV-25), [implementation-plan.md](implementation-plan.md) (estratégia de testes, secção 5) e [verification.md](verification.md) (casos 03, 04 e 08).

## 1. Legenda

**Atores:**
- **Gestor:** Gestor do projeto.
- **Membro:** membro do projeto que não é responsável pela tarefa.
- **Não membro:** Gestor de outro projeto ou Administrador, que nunca é membro (RV-32).

**Níveis de teste** ([implementation-plan.md](implementation-plan.md), secção 5):
- **U:** unitário (Vitest), para regras puras.
- **I:** integração da API (Vitest e Supertest, com uma base SQLite temporária).
- **M:** manual, no navegador e com pedidos diretos à API ([verification.md](verification.md)).

Os caminhos são relativos a `/api/projetos/{p}`, em que `{p}` é o projeto e `{t}` a tarefa.

## 2. Cenários essenciais

| # | Cenário | Ator | Entradas | Resultado esperado | Nível | Ref. |
|---|---|---|---|---|---|---|
| TP-01 | Título inválido | Gestor | `POST /tarefas` com `titulo` igual a `""`, `"   "` ou com 201 caracteres | 422 `TITULO_OBRIGATORIO` / `LIMITE_EXCEDIDO`; nenhuma tarefa é criada; a interface mantém os dados e não mostra sucesso | I + M (U previsto, secção 4) | EC-01, EC-02, EC-29, EC-50 |
| TP-02 | Criar só com o título | Gestor | `POST /tarefas {titulo}` | 201; `TODO`, `MEDIUM`, sem responsáveis; aparece na lista e as contagens sobem 1 | I + M | CA-11.1, CA-11.5 |
| TP-03 | Criar e consultar depois | Gestor | `POST /tarefas` com todos os campos, depois `GET /tarefas/{t}` | O `GET` devolve os mesmos valores, com estado `TODO`; mantém-se depois de reiniciar o backend | I + M | CA-11.2, RNF-09 |
| TP-04 | Consultar uma tarefa de outro membro | Membro | `GET /tarefas/{t}` de uma tarefa de que não é responsável | 200; lê a descrição, mas não a pode editar | I | CA-17.2 |
| TP-05 | Criar sem permissão | Membro | `POST /tarefas {titulo}` no seu projeto | 403 `SEM_PERMISSAO`; nenhuma tarefa é criada; a interface não mostra o botão | I + M | EC-05 |
| TP-06 | Acesso de quem não é membro | Não membro | `GET`, `PATCH` ou `POST` com `{p}` ou `{t}` de outro projeto, também trocando os identificadores | 404 `NAO_ENCONTRADO`, sem revelar se a tarefa existe; os dados ficam iguais | I | EC-18, RV-32 |

## 3. Cobertura

| # | Testes automáticos (`backend/testes/tarefas.test.ts`) | Verificação manual ([verification.md](verification.md); casos da secção 6.2, salvo indicação) |
|---|---|---|
| TP-01 | "EC-01, EC-02: título vazio ou só com espaços é recusado (regra de validação)"; "EC-29: título acima de 200 e descrição acima de 5000 caracteres são recusados" | Caso 04 |
| TP-02 | "CA-11.1: só com o título: "Por fazer", prioridade Média, sem responsáveis, e aparece na lista"; "CA-11.5: as contagens do projeto refletem a nova tarefa" | Caso 03 |
| TP-03 | "CA-11.2: com todos os campos; os valores ficam guardados (persistência)" | Caso 03 (reinício do backend) |
| TP-04 | "CA-17.2: um membro lê a descrição de uma tarefa de que não é responsável" (leitura); "CA-14.3: um Membro não altera a descrição de uma tarefa de que não é responsável" (edição recusada) | — |
| TP-05 | "EC-05: um Membro recebe 403 e um Gestor de outro projeto recebe 404 (autorização)" | Caso 08 (API); passo M1 da secção 2.3 (sem ações de gestão na interface) |
| TP-06 | "EC-18: uma tarefa de outro projeto não é encontrada, mesmo mudando o identificador do projeto"; "D-05: não lê, não cria nem elimina tarefas (404)" | Caso 08 |

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
| 3 | TP-01 com nível unitário | Não existe teste unitário da validação do título; só o teste de integração com Supertest | Nível corrigido para I + M; o teste unitário fica para o Exercício 2. |
| 4 | TP-04 coberto só pelo teste CA-17.2 | Esse teste verifica a leitura, mas não a recusa da edição | Acrescentado à cobertura o teste CA-14.3. |
| 5 | TP-05 verificado na interface pelo caso 08 | O caso 08 só usou pedidos à API; a ausência das ações na interface está no passo M1 da secção 2.3 de [verification.md](verification.md) | Cobertura manual corrigida. |
| 6 | O comando da secção 3 correria "só estes testes" | Corre o ficheiro inteiro (41 testes, todos a passar a 5 de novembro de 2026) | Texto corrigido. |

### 4.3 Pressupostos por aprovar

- A série de IDs TP-xx é nova e serve só para identificar os cenários deste plano.
- O nome do ficheiro (`test-plan.md`) segue o enunciado da Ficha 4, embora o conteúdo esteja em português.
