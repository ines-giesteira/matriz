# Matriz — Revisão de qualidade e de segurança

Versão 0.1 · 8 de novembro de 2026 · Ficha Prática 04, Exercício 5

> **Estado:** Code Review do último incremento de código (I10) e do diff da Ficha 4, Security Review do acesso a projetos e tarefas com contas de demonstração, e análise estática com as ferramentas disponíveis. **Nenhuma vulnerabilidade confirmada.** Há dois pontos de segurança e três de qualidade por decidir (secção 6); nenhuma correção foi aplicada, à espera de revisão humana.

**Fontes:** [requirements.md](requirements.md) (matriz de permissões, RNF-04), [constraints.md](constraints.md) (secção 3, segurança e privacidade), [`openapi.yaml`](../openapi.yaml) (códigos de erro e ordem de verificação, RV-25), [verification.md](verification.md) (caso 08), [test-plan.md](test-plan.md).

**Legenda:** **Facto** = observado numa execução ou no código; **Hipótese** = possível, mas não demonstrado. Severidade: Alta, Média, Baixa.

## 1. Âmbito

| Parte | O que foi revisto |
|---|---|
| Code Review | Último incremento de código, I10 (`b2d3d1b` e `504732a`: hook `usarAcao` e correção do P1, só no frontend), e o diff da Ficha 4 (`06fc098` a `bc9c67c`: testes, exportação de `validarDados`, configuração do Playwright). Foco em bugs, validações, tratamento de erros e testes em falta. |
| Security Review | Acesso a projetos, membros, tarefas, responsáveis, comentários e progresso pela API real; exposição de dados; autenticação e sessão; segredos. |
| Análise estática | As ferramentas existentes no projeto (secção 4). |

## 2. Code Review

| ID | Ficheiro | Evidência | Impacto | Sev. | Tipo | Correção proposta | Teste de regressão sugerido |
|---|---|---|---|---|---|---|---|
| CR-01 | `frontend/src/api/usarAcao.ts` e componentes que o usam | O frontend não tem testes automáticos (só o backend usa Vitest). A proteção contra submissão repetida (EC-51) e a limpeza da mensagem de sucesso (P1, EC-50) só foram verificadas à mão; o próprio EC-51 tem uma limitação registada em [verification.md](verification.md), secção 6.6. | Uma regressão nestes comportamentos só seria detetada manualmente. | Média | Facto | Acrescentar testes de componentes (por exemplo, Vitest com Testing Library) ou um cenário E2E com um pedido lento. Implica uma dependência nova, por isso precisa de aprovação. | Duplo clique em "Criar tarefa" com a resposta da API atrasada: uma só tarefa criada (EC-51). |
| CR-02 | `backend/src/modulos/tarefas/servico.ts` (`validarDados`, `criar`, `editar`) | O título é validado e guardado sem retirar os espaços das pontas; o nome do projeto é guardado sem eles (`projetos/servico.ts`, `nome.trim()`). Ver [test-plan.md](test-plan.md), secção 5.4. | Títulos como `"  Rever  "` ficam guardados com espaços e contam para o limite de 200; incoerente com os projetos. | Baixa | Facto | Decisão da dona do produto: retirar os espaços das pontas antes de validar e guardar (como nos projetos), ou manter. | Título `"  Rever  "` guardado como `"Rever"`; 200 letras com espaços nas pontas aceites. |
| CR-03 | `frontend/src/componentes/TarefasProjeto.tsx` | Registado no I9 (R3, [verification.md](verification.md), secção 6.5): depois de "Não encontrado." ao mudar o estado de uma tarefa eliminada por outro pedido, a linha continua na lista até recarregar. | A lista mostra uma tarefa que já não existe; nenhum dado se perde. | Baixa | Facto | Recarregar a lista quando a API responde 404 a uma ação sobre uma tarefa. | Mudar o estado de uma tarefa eliminada noutro pedido: a linha desaparece. |
| CR-04 | `playwright.config.ts`, `e2e/limpar-bases.ts` | O caminho da base do E2E pode vir de `MATRIZ_E2E_BD`, se já estiver definida no ambiente; a limpeza apaga na pasta temporária os ficheiros `matriz-e2e-*` de outras execuções. | Se `MATRIZ_E2E_BD` apontasse para outra base, o E2E escrevia nela; duas execuções do E2E em simultâneo (por exemplo, em duas worktrees) podiam apagar a base uma da outra fora do Windows, onde um ficheiro aberto pode ser apagado. | Baixa | Hipótese | Gerar sempre o caminho e passá-lo aos processos por uma variável própria da execução; limpar só bases com mais de um dia. | Correr `npm run test:e2e` com `MATRIZ_E2E_BD` definida: a base indicada não é usada. |

**Revisto sem problemas:**
- `usarAcao` bloqueia o segundo pedido com uma referência antes de o React redesenhar o botão, e devolve `false` sem efeitos (EC-51). Em `Tarefa.tsx`, o `finally` atualiza o estado depois de `navegar`, já com a página desmontada; no React atual isto não tem efeito nem aviso.
- A transferência e a eliminação de projetos (`AdminProjetos.tsx`) passaram a ter a mesma proteção contra pedidos repetidos, que antes não tinham.
- A exportação de `validarDados` não muda o comportamento: os 243 testes passam (secção 5).

## 3. Security Review: acesso a projetos e tarefas

### 3.1 Método

Primeiro, um script de verificação foi executado a 8 de novembro de 2026 contra a aplicação Express real (`criarApp`), num porto local livre, sobre uma base SQLite nova na pasta temporária do sistema com os dados de demonstração. Os pedidos foram feitos por HTTP, com o cookie de sessão de cada conta. A base de desenvolvimento não foi usada; a base temporária foi apagada no fim.

Depois, as verificações H01 a H19, V01 a V12, D01 a D05 e E01 passaram a teste automático, para serem reproduzíveis: `backend/testes/seguranca-acessos.test.ts` (Vitest e Supertest, base SQLite em memória por teste, a mesma aplicação Express). Em cada grupo, o teste confirma também que as tabelas `tarefa`, `membro_projeto`, `atribuicao`, `comentario`, `projeto` e `perfil_atribuido` ficam iguais depois dos pedidos recusados (E01). As observações SEG-01 e SEG-02 não entraram no teste, porque não correspondem a requisitos.

```bash
npx vitest run --root backend testes/seguranca-acessos.test.ts
```

Contas de demonstração: **Marta** (Membro de "Lançamento do novo site", projeto 1), **Paulo** (Gestor de "Migração do CRM", projeto 2), **Ana** (Gestora do projeto 1). Tarefas usadas: 11 (projeto 2), 1 e 3 (projeto 1).

### 3.2 Broken Access Control e IDOR

| Grupo | Casos | Pedidos | Esperado | Obtido |
|---|---|---|---|---|
| Horizontal: Marta → projeto do Paulo | H01 a H06, H10, H11, H13 | `GET` e `PATCH /projetos/2`; membros (`GET`, e `POST` dela própria); tarefas e tarefa 11; juntar-se à tarefa 11; comentários; progresso | 404 `NAO_ENCONTRADO` | 404 em todos |
| Horizontal com troca de identificadores: tarefa de outro projeto pelo caminho do próprio | H07 a H09, H12, H14 (Marta); H17, H18 (Paulo) | `GET`, `PATCH`, `PUT /estado`, `POST /comentarios` e `DELETE` em `/projetos/{próprio}/tarefas/{alheia}` | 404 | 404 em todos |
| Horizontal: Paulo → projeto da Marta | H16, H19 | Lista de tarefas; remover a Marta dos membros | 404 | 404 em ambos |
| Pesquisa | H15 | Marta: `GET /projetos?nome=crm` | Lista sem o projeto alheio (D-10) | `[]` |
| Vertical: Membro → ações de Gestor | V01 a V06 | Criar, editar o título de uma tarefa de que não é responsável, eliminar, arquivar, candidatos a membros, remover um membro | 403 `SEM_PERMISSAO` | 403 em todos |
| Vertical: Membro → ações de Administrador | V07 a V09 | Listar utilizadores; dar a si própria o perfil Administrador; administração de projetos | 403 | 403 em todos |
| Vertical: Gestor → ações de Administrador | V10 a V12 | Criar projeto; transferir o projeto 1 para si; eliminar o projeto 1 | 403 | 403 em todos |
| Integridade | E01 | Tarefas e membros na base, antes e depois de todos os pedidos recusados | Iguais | Iguais |

**Resultado:** 0 casos com resultado diferente do esperado, no script e no teste automático (9 testes, todos a passar). **Nenhum IDOR nem escalada de privilégios.**

**Os testes falham se a autorização falhar?** O código de produção foi alterado temporariamente de três formas; em cada uma, os testes foram corridos e o ficheiro foi reposto (`git status` sem alterações em `backend/src` no fim):

| Alteração temporária | Testes que falharam |
|---|---|
| `projetoDoMembro` deixa de verificar se o utilizador é membro | H01-H14, H16-H19 e D03 |
| `eGestorDoProjeto` passa a aceitar qualquer utilizador | V01-V09 |
| `lerTarefa` deixa de exigir que a tarefa seja do projeto do caminho | H01-H14 e H16-H19 | O cenário de autorização entre dois utilizadores de demonstração (critério de conclusão da Ficha) está validado. Os testes automáticos já cobrem parte destes casos (EC-05, EC-12, EC-18, EC-41, EC-46 em `backend/testes/`) e o caso manual 08 de [verification.md](verification.md) repetiu-os na interface e na API.

### 3.3 Exposição de dados e entradas do cliente

| ID | Verificação | Resultado | Tipo |
|---|---|---|---|
| D01 | Campos de `GET /projetos/1/membros` para um Membro | `id`, `nome`, `contaAtiva`: sem email (Q-13) | Facto |
| D02 | Campos de `GET /sessao` | `id`, `nome`, `email`, `perfis`: sem palavra-passe nem hash (EC-49) | Facto |
| D03 | Projeto inexistente (999999) e projeto alheio | Resposta igual (404 `NAO_ENCONTRADO`, mesma mensagem): não revela se o projeto existe | Facto |
| D04 | Comentário com `autorId` e `criadoEm` enviados pelo cliente | 400 `PEDIDO_INVALIDO`: autor e data só vêm da sessão e do servidor (EC-45) | Facto |
| D05 | `PATCH` de tarefa com `projetoId` e `estado` no corpo (atribuição em massa) | 400 `PEDIDO_INVALIDO`: os esquemas recusam campos desconhecidos | Facto |
| — | Construção de SQL | Todas as consultas usam parâmetros (`prepare(...).get(?)`); nenhuma interpola valores (pesquisa no código) | Facto |
| — | Comparação da palavra-passe numa conta inexistente | `entrar` compara sempre com um hash (`HASH_FICTICIO`), por isso o tempo de resposta não revela se o email existe | Facto (código) |

### 3.4 Autenticação, sessão e configuração

| ID | Verificação | Resultado | Sev. | Tipo |
|---|---|---|---|---|
| SEG-01 | 20 tentativas de entrada seguidas com a palavra-passe errada na conta do João, e depois a certa | 401 nas 20; a seguir, 200. Não há limite de tentativas, atraso nem bloqueio. | Média | Facto (ausência de controlo) |
| SEG-02 | Cabeçalhos de segurança em `GET /api/saude` | Sem `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options` nem `Strict-Transport-Security` | Baixa | Facto |
| — | Atributos do cookie de sessão | `HttpOnly; SameSite=Lax; Path=/`. `Secure` só com `NODE_ENV=production`, como previsto (P2) | — | Facto |
| — | Pedidos entre sites (CSRF) | `SameSite=Lax` e o corpo só é lido como JSON; um formulário de outro site não envia JSON nem, num `POST`, o cookie. Não foi testado com um site externo. | — | Hipótese |

**Impacto e contexto:**
- **SEG-01:** permite adivinhar palavras-passe por tentativa e erro sem limite. O piloto é interno, com 10 a 20 pessoas (RNF-05, RNF-06), e as palavras-passe têm pelo menos 8 caracteres (P3), o que reduz o risco, mas não o elimina. **Não há requisito** sobre o número de tentativas: acrescentar um limite é uma regra nova e precisa de decisão da dona do produto (AGENTS.md, regra 2).
- **SEG-02:** sem `X-Frame-Options` ou `frame-ancestors`, a interface pode ser incluída numa página de outro site (clickjacking), por exemplo para levar a carregar em "Eliminar". O impacto depende de como a interface é servida em produção, que não está definido.

## 4. Análise estática

Não há ESLint, Semgrep nem SonarQube configurados no projeto; não foram acrescentados, porque seriam uma dependência ou um serviço novo sem aprovação. Foram usadas as verificações disponíveis:

| Ferramenta | Comando | Resultado |
|---|---|---|
| Auditoria de dependências | `npm audit` | 0 vulnerabilidades |
| TypeScript estrito (backend) | `npm run typecheck -w backend` | Sem erros |
| TypeScript estrito (frontend) | `npx tsc -p frontend/tsconfig.json --noEmit` | Sem erros |
| Procura de segredos | `git grep` por chaves, tokens e palavras-passe atribuídas no código; `.env` no histórico | Só palavras-passe fictícias dos testes (`palavra-passe-de-teste`, `inicial-1234`) e do E2E (`e2e/dados.ts`), e o valor fictício de `.env.example`; o `.env` nunca entrou no Git |
| Padrões perigosos | Procura de `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` e SQL com interpolação | Nenhum |

**Suspeitas e confirmadas:** a análise estática não encontrou nenhuma suspeita. As duas observações de segurança (SEG-01 e SEG-02) foram confirmadas por execução, mas são ausências de controlos não exigidos pelos requisitos, não violações da matriz de permissões.

## 5. Verificações executadas e por validar

**Executadas a 8 de novembro de 2026:**
- O script da secção 3, com 37 verificações (19 horizontais, 12 verticais, 5 de exposição de dados e 1 de integridade; 0 diferenças do esperado) e 3 observações (SEG-01, SEG-02 e o cookie).
- As verificações da secção 4.
- O teste automático `seguranca-acessos.test.ts` (9 testes) e as três alterações temporárias da secção 3.2.
- `npm test`: 12 ficheiros e 252 testes, todos a passar. `npm run test:e2e`: 1 teste a passar.

**Por validar:**
- CSRF com um site externo real (secção 3.4).
- Cabeçalhos e HTTPS no ambiente de produção, que não está definido.
- Concorrência: dois Gestores a alterar a mesma tarefa ao mesmo tempo.
- Semgrep ou SonarQube: não estão disponíveis no projeto.

## 6. Decisões

| # | Ponto | Decisão |
|---|---|---|
| 1 | Correções aplicadas | **Nenhuma.** Não há vulnerabilidades confirmadas nem violações da matriz de permissões; o Exercício 5 só pede a correção de problemas confirmados e prioritários, depois de revisão humana. |
| 2 | SEG-01, limite de tentativas de entrada | Por decidir pela dona do produto: é uma regra nova (número de tentativas, duração do bloqueio). Recomendado antes de expor a aplicação fora da rede interna. |
| 3 | SEG-02, cabeçalhos de segurança | Por decidir, com o modo de publicação da interface em produção. |
| 4 | CR-01, testes do frontend | Por decidir: implica uma dependência nova. |
| 5 | CR-02, espaços nas pontas do título; CR-03, linha da tarefa eliminada; CR-04, isolamento do E2E | Baixa severidade; por decidir. |
| 6 | Script de IDOR da secção 3 | Passou a teste automático (`backend/testes/seguranca-acessos.test.ts`), aprovado na revisão humana; corre com `npm test`. Não é um teste de regressão de uma correção, porque nenhuma foi aplicada: protege a matriz de permissões contra regressões futuras. |
