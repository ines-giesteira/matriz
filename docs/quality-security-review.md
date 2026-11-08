# Matriz — Revisão de qualidade e de segurança

Versão 0.2 · 8 de novembro de 2026 · Ficha Prática 04, Exercício 5 · a 0.2 acrescenta a segunda revisão de segurança (secção 7, SEG-03 a SEG-10)

> **Estado:** Code Review do último incremento de código (I10) e do diff da Ficha 4, Security Review do acesso a projetos e tarefas com contas de demonstração, e análise estática com as ferramentas disponíveis. **Nenhum IDOR nem escalada de privilégios.** A segunda revisão (secção 7) encontrou 8 pontos novos (3 de severidade Média e 5 de Baixa), sete confirmados por execução; todos os pontos estão decididos desde 8 de novembro de 2026 (secções 6 e 7.5). SEG-01 a SEG-10 estão corrigidos; as correções de qualidade CR-01 a CR-04 estão por implementar.

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
- **SEG-01:** permite adivinhar palavras-passe por tentativa e erro sem limite. O piloto é interno, com 10 a 20 pessoas (RNF-05, RNF-06), e as palavras-passe têm pelo menos 8 caracteres (P3), o que reduz o risco, mas não o elimina. Não havia requisito sobre o número de tentativas; a dona do produto decidiu-o a 8 de novembro de 2026 (RV-35, [constraints.md](constraints.md)): 5 falhas por conta em 15 minutos bloqueiam a entrada nessa conta durante 15 minutos.
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
| 1 | Correções aplicadas | SEG-01 corrigido (RV-35, commit `8aaeb44`). As restantes correções estão decididas (08/11/2026) e por implementar. |
| 2 | SEG-01, limite de tentativas de entrada | **Decidido (RV-35, 08/11/2026):** 5 tentativas falhadas por conta em 15 minutos; à 5.ª, a entrada nessa conta fica bloqueada durante 15 minutos (duração confirmada); uma entrada com sucesso repõe o contador. **Implementado** (EC-57, P29). |
| 3 | SEG-02, cabeçalhos de segurança | **Decidido (08/11/2026) e implementado (P35):** o backend acrescenta `X-Content-Type-Options`, `X-Frame-Options` e uma `Content-Security-Policy` às suas respostas, sem dependência nova. Os cabeçalhos da interface publicada continuam a depender do alojamento. |
| 4 | CR-01, testes do frontend | **Decidido (08/11/2026):** acrescentar testes de componentes ao frontend (dependência nova aprovada), começando por EC-50 e EC-51. Por implementar. |
| 5 | CR-02, espaços nas pontas do título; CR-03, linha da tarefa eliminada; CR-04, isolamento do E2E | **Decidido (08/11/2026):** corrigir os três como proposto na secção 2. Por implementar. |
| 6 | Script de IDOR da secção 3 | Passou a teste automático (`backend/testes/seguranca-acessos.test.ts`), aprovado na revisão humana; corre com `npm test`. Não é um teste de regressão de uma correção, porque nenhuma foi aplicada: protege a matriz de permissões contra regressões futuras. |
| 7 | SEG-03 a SEG-10 (segunda revisão) | Decididos; ver secção 7.5. |

## 7. Segunda revisão de segurança (SEG-03 a SEG-10)

### 7.1 Âmbito e método

Revisão de segurança, feita a 8 de novembro de 2026, das regras de autorização e do código do backend (sessão, contas, projetos, membros, tarefas, responsáveis, comentários, progresso, anonimização e configuração), e do diff desde a tag `entrega-ficha3`. No código de produção, esse diff só exporta `validarDados`.

Os pontos foram confirmados com scripts executados fora do repositório, contra a aplicação Express real (`criarApp`), com uma base SQLite em memória criada com os dados de demonstração. A base de desenvolvimento não foi usada e nenhum ficheiro do repositório foi alterado durante a revisão.

### 7.2 Findings

| ID | Ficheiro | Evidência | Impacto | Sev. | Tipo | Correção proposta | Teste de regressão sugerido |
|---|---|---|---|---|---|---|---|
| SEG-03 | `backend/src/bd/cli-seed.ts`, `backend/src/bd/seed.ts`, `.env.example` | A primeira conta de Administrador só pode ser criada pelo seed de demonstração (CA-02.2 "pelo seed", [implementation-plan.md](implementation-plan.md), I3). O seed cria 6 contas, com os emails do README e todos com a mesma palavra-passe; o valor de exemplo dessa palavra-passe está no `.env.example`, que está no Git. O `cli-seed.ts` não verifica `NODE_ENV` nem recusa o valor de exemplo. | Se o piloto for instalado como o README indica (`.env` copiado do exemplo e seed), quem leu o repositório entra como Administradora e controla contas, perfis e projetos; os dados fictícios ficam na base do piloto. | Média (Alta se o piloto for instalado assim) | Facto (código); impacto hipotético | Já: o seed recusa correr com `NODE_ENV=production` ou com o valor de exemplo. Depois, por decisão da dona do produto: um comando que cria só a primeira conta de Administrador (RV-11), sem dados de demonstração. | Com `NODE_ENV=production`, o seed termina com erro e a tabela `utilizador` fica vazia. |
| SEG-04 | `backend/src/modulos/contas/servico.ts` (`entrar`, `bcrypt.compareSync`) | Cada comparação demora cerca de 57 ms e o servidor não responde a mais nada nesse tempo. Com 30 entradas erradas em paralelo, sem sessão, `GET /api/saude` passou de 2 ms para 2554 ms. A versão assíncrona do bcryptjs (`compare`) bloqueia o mesmo: um temporizador de 0 ms esperou cerca de 1,1 s durante 20 comparações. | Cerca de 20 pedidos por segundo, sem sessão, degradam a aplicação para todos. Agrava SEG-01. | Média | Facto (medido) | Principal: o limite de tentativas, que depende da decisão de SEG-01. Complementar: verificar a palavra-passe fora da thread principal (`node:worker_threads`, sem dependência nova). Mudar para `compare` não resolve. | Com 10 entradas erradas em curso, `GET /api/saude` responde antes de terminar a última. |
| SEG-05 | `backend/src/modulos/contas/gestao.ts` (`alterar`); `backend/src/modulos/contas/repositorio.ts` (`anonimizarConta`) | Uma conta com o perfil Gestor foi adicionada a 2 projetos ativos (201, 201); `PATCH {perfis: []}` respondeu 200 e a conta ficou sem perfis e membro de 2 projetos ativos. A seguir, a Gestora arquivou o projeto 1 e desarquivá-lo deu 409 `MEMBRO_NOUTRO_PROJETO`. O mesmo estado aparece ao desativar e anonimizar a conta: os perfis são apagados (P27) e a pertença mantém-se (RV-34). Ao retirar o perfil Gestor só se verifica se a pessoa ainda gere projetos. | RV-31 fica quebrado por uma ação normal do Administrador; o Gestor só desarquiva depois de remover a pessoa. Sem acesso indevido. | Média | Facto | Regra em falta, a decidir pela dona do produto: (a) recusar com 422 retirar o perfil Gestor a quem está em mais de um projeto ativo, como no EC-55; ou (b) aceitar e documentar. Clarificar também RV-34 (2) face a RV-31 nas contas anonimizadas. | Com a opção (a): retirar o perfil Gestor a quem está em 2 projetos ativos responde 422 e os perfis ficam iguais. |
| SEG-06 | `backend/src/modulos/contas/anonimizacao.ts` (ciclo de `anonimizarContasExpiradas`); `repositorio.ts` (`anonimizarConta`); `gestao.ts` (`EMAIL_VALIDO`) | O Administrador criou uma conta com o email `removida-{id}@matriz.invalid` de uma conta desativada (201). A rotina de anonimização falhou com `UNIQUE constraint failed` e parou: essa conta e a seguinte ficaram por anonimizar. Em produção, o erro só vai para o registo e repete-se todos os dias. | O nome e o email de contas desativadas ficam guardados além de um ano, sem aviso (RV-33). Exige uma conta criada pelo Administrador com esse email. | Baixa | Facto | Recusar na criação de contas o domínio reservado `.invalid`; tratar cada conta em separado no ciclo, para uma falha não bloquear as outras. | Com essa conta criada, as outras contas desativadas há mais de um ano continuam a ser anonimizadas. |
| SEG-07 | `backend/src/modulos/contas/gestao.ts` (`criar`); `servico.ts` (`entrar`) | Conta criada com uma palavra-passe de 36 caracteres "ç" (72 bytes em UTF-8) mais um sufixo: entrar com outro sufixo deu 200, e só com os 36 caracteres também. O bcrypt usa apenas os primeiros 72 bytes. | Nas palavras-passe longas, sobretudo com acentos, a parte final é ignorada. Só o Administrador as define (P3). | Baixa | Facto | Recusar com 422 palavras-passe acima de 72 bytes (limite novo, precisa de aprovação); o bcryptjs 3 tem `truncates()`. | Criar uma conta com uma palavra-passe de mais de 72 bytes responde 422. |
| SEG-08 | `backend/migrations/001_esquema_inicial.sql` (`email ... COLLATE NOCASE`) | `élia@…` e `ÉLIA@…` foram ambos aceites (201, 201); `ANA.SILVA@…` foi recusado (422 `EMAIL_REPETIDO`). O `NOCASE` do SQLite só ignora maiúsculas de A a Z. | Podem existir duas contas com o mesmo email segundo Q-10; confusão ao entrar. Raro. | Baixa | Facto | Por decidir: normalizar o email para minúsculas antes de guardar e de procurar, ou recusar emails com caracteres fora do ASCII (P25). | Criar `ÉLIA@x` depois de `élia@x` responde 422 `EMAIL_REPETIDO` (EC-33). |
| SEG-09 | `backend/src/app.ts` (`tratarErros`) | `POST /api/sessao` com 200 kB, sem sessão, respondeu 500 `ERRO_INTERNO` e escreveu o erro completo no registo. Só o JSON mal formado é tratado; os outros erros da leitura do pedido caem no 500. | Código de resposta errado; qualquer pessoa sem sessão consegue encher o registo e esconder erros reais. | Baixa | Facto | Responder 400 `PEDIDO_INVALIDO` (já no contrato) aos erros de leitura do pedido com estado 4xx, sem os registar. | Um pedido com 200 kB responde 400 e não escreve no registo. |
| SEG-10 | `backend/src/config.ts` (`cookieSeguro`); `backend/package.json` (`start`); `.env.example` | O atributo `Secure` do cookie só fica ativo com `NODE_ENV=production`; o `npm start` não define `NODE_ENV`, e o `.env.example` também não. | Depende do alojamento, por definir: com algum acesso por HTTP, o cookie de sessão pode passar sem cifra. | Baixa | Hipótese | Ativar o `Secure` por omissão, exceto em desenvolvimento, ou acrescentar `NODE_ENV` ao `.env.example`. | Sem `NODE_ENV` definido, a configuração ativa o `Secure`. |

### 7.3 Revisto sem problemas

- **Broken Access Control e IDOR:** os 9 testes de `seguranca-acessos.test.ts` passam. Foram acrescentadas 15 verificações por script, todas com o resultado esperado: um Membro junta outra pessoa a uma tarefa ou remove-a (403); um Membro responsável edita a descrição e o título (403); um Gestor indica como responsável alguém de outro projeto (422) ou mexe numa tarefa de outro projeto pelo caminho do seu (404); o Administrador tenta ver tarefas, progresso ou comentários (404); um Gestor usa as rotas `/admin` (403); pedidos sem sessão ou com um cookie inventado (401).
- **SQL:** todas as consultas usam parâmetros; as listas `IN (...)` só levam marcadores `?`.
- **Atribuição em massa:** os esquemas recusam campos desconhecidos; o autor e a data dos comentários vêm da sessão e do servidor.
- **Sessão:** identificador aleatório de 256 bits; na base guarda-se só o hash SHA-256; a expiração é decidida no servidor; cada pedido relê a conta e os perfis (RV-09).
- **Exposição de dados:** o hash da palavra-passe nunca é devolvido; um Membro vê só o nome dos colegas, sem email (Q-13).
- **Segredos:** nenhum no código nem no histórico; o `.env` nunca entrou no Git. Os resultados da procura são palavras-passe fictícias dos testes e do E2E.
- **Frontend:** sem `dangerouslySetInnerHTML`, `innerHTML` nem `eval`.

### 7.4 Verificações executadas e por validar

**Executadas a 8 de novembro de 2026:**
- `npm test`: 12 ficheiros e 252 testes, todos a passar.
- `npm run typecheck -w backend` e `tsc --noEmit` do frontend: sem erros.
- `npm audit`: 0 vulnerabilidades.
- Scripts de confirmação de SEG-04 a SEG-09 e das 15 verificações de IDOR (secção 7.3), com base em memória.
- Medição do bloqueio do bcryptjs nas versões síncrona e assíncrona.

**Por validar:**
- `npm run test:e2e` e `npm run build`: não executados nesta revisão.
- CSRF com um site externo real (secção 3.4).
- SEG-03 e SEG-10: dependem de como o piloto vai ser instalado.
- Concorrência entre vários processos do backend: o arranque atual usa um só processo.

### 7.5 Decisões

| # | Ponto | Decisão |
|---|---|---|
| 1 | Correções aplicadas | Todas decididas a 08/11/2026. Todas implementadas (SEG-02 a SEG-10). |
| 2 | SEG-03, arranque do piloto | **Decidido (RV-37) e implementado (P30):** `npm run bd:primeiro-admin` cria a primeira conta de Administrador; o seed recusa correr sem `NODE_ENV=development` e com o valor de exemplo. |
| 3 | SEG-04, bloqueio na entrada | O limite de RV-35 reduz o abuso numa só conta, mas não o resolve: é por conta, e pedidos para muitos emails diferentes continuam a ocupar o servidor. **Decidido (08/11/2026) e implementado (P34):** a palavra-passe é verificada numa worker thread (`node:worker_threads`, sem dependência nova). Com 30 entradas em paralelo, `GET /api/saude` passou de 2554 ms para 7 ms. |
| 4 | SEG-05, RV-31 ao retirar o perfil Gestor | **Decidido (RV-36) e implementado (EC-58, P31):** recusado com 422 `GESTOR_EM_VARIOS_PROJETOS` enquanto a pessoa for membro de mais de um projeto ativo. Fica por decidir o caso da anonimização: apaga os perfis de um ex-Gestor que continua membro de vários projetos ativos (RV-34). |
| 5 | SEG-06 a SEG-10 | **Decididos (08/11/2026) e corrigidos:** SEG-06 (RV-40: domínio `.invalid` recusado e anonimização conta a conta, P31, P33), SEG-07 (RV-38: máximo de 72 bytes, P31) e SEG-08 (RV-39: email em minúsculas, incluindo acentos, P32) estão implementados; SEG-09 (400 `PEDIDO_INVALIDO` para pedidos ilegíveis, sem registo, P36) e SEG-10 (`Secure` por omissão, exceto com `NODE_ENV=development`, P37) também. |
