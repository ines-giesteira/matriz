# Matriz — Verificação

Versão 0.4 · 8 de novembro de 2026 · Ficha Prática 03, Exercícios 7 (incremento I8), 8 (incremento I9) e 9 (incremento I10) · a 0.4 acrescenta notas sobre o que a Ficha 4 mudou depois (secções 3, 6.5, 6.6 e 7.1), sem alterar os resultados registados a 1 e 2 de novembro.

> **Estado:** percurso manual completo do I8 (secções 1 a 5), cenários 01 a 09 da Ficha 3 do I9 (secção 6) e revisão para a entrega do I10 (secção 7), feitos na interface e em pedidos diretos à API, com a base de dados real. As verificações manuais estão separadas dos testes automáticos (secções 3 e 6.3).

**Fontes:** [user-stories.md](user-stories.md) (CA e EC), [requirements.md](requirements.md) (RF), [constraints.md](constraints.md) (RV), [implementation-plan.md](implementation-plan.md) (I8 a I10).

## 1. Ambiente

| Item | Valor |
|---|---|
| Data | 1 e 2 de novembro de 2026 (dia de hoje em Europe/Lisbon: 01/11/2026 durante o percurso) |
| Arranque | `npm run dev` (backend em `http://localhost:3000/api`, interface em `http://localhost:5173`) |
| Base de dados | `dados/matriz.sqlite`, criada com `npm run bd:migrar` e `npm run bd:seed` (2 migrations) |
| Navegador | Navegador da aplicação Claude (Chromium); larguras de 919 px e 375 px |
| Contas | Helena Matos (Administrador, do seed) e duas contas criadas no percurso: "Gestor Teste" (Gestor) e "Membro Teste" (Membro), com uma palavra-passe de teste que não fica registada no repositório |
| Dados | Depois do percurso, a base foi recriada a partir do seed; os dados de teste não ficam no repositório nem na base de demonstração |

## 2. Percurso manual (I8)

Cada passo foi feito na interface; o resultado observado foi confirmado no ecrã e, quando indicado, no pedido enviado à API ou na base de dados.

### 2.1 Administrador (Helena)

| # | Ação | Resultado esperado | Resultado observado | Requisitos |
|---|---|---|---|---|
| A1 | Entrar como Helena | Painel com o nome, o perfil "Administrador" e ligações para as duas administrações; menu "Projetos" e "Contas"; sem "Os meus projetos" | Como esperado | CA-01.1, RV-32 |
| A2 | Abrir "Administração de contas" | Todas as contas: ativas por nome e, no fim, as desativadas; "(a sua conta)" na Helena | 6 contas; Rui Costa (desativado) no fim | P26, RF-02 |
| A3 | "Nova conta" e "Criar conta" com o formulário vazio | Mensagens em cada campo; nenhum pedido à API | 3 mensagens; nenhum `POST /utilizadores` | RF-02, P25 |
| A4 | Criar "Gestor Teste" com o perfil Gestor | Conta criada, com mensagem de sucesso, e na lista | Como esperado | CA-02.1 |
| A5 | Criar "Membro Teste" com o email `Ana.Silva@Matriz.Test` | Recusa no campo do email; nome, email e palavra-passe ficam no formulário | "Já existe uma conta com este email."; dados mantidos | EC-33, EC-38, EC-50 |
| A6 | Corrigir o email para `membro.teste@matriz.test` e criar | Conta criada | Como esperado | CA-02.1 |
| A7 | Criar o projeto "Verificação do MVP" com o Gestor Teste | Projeto criado e na lista de administração | "Verificação do MVP" foi criado, com Gestor Teste como Gestor | CA-05.1, RF-04 |
| A8 | "Membros" do novo projeto | Só o Gestor; candidatos: Gestores e Membros sem projeto ativo, sem Administradores | Candidatos: Ana Silva, Membro Teste, Paulo Reis; sem João, Marta (já num projeto ativo) nem Helena | EC-54, RV-31, RV-32 |
| A9 | Adicionar o Membro Teste | Passa a membro e sai dos candidatos | Como esperado | EC-54, CA-07.2 |
| A10 | Mudar o perfil do Membro Teste para Administrador | Recusa, por ser membro de um projeto | "Um Administrador não pode ser membro de projetos. Remova primeiro esta pessoa de todos os projetos." | EC-55 |
| A11 | Desativar o Gestor Teste (com confirmação) | Recusa, por gerir um projeto; a conta continua ativa | "Transfira primeiro todos os projetos deste Gestor."; estado "Ativa" | EC-23 |
| A12 | Desativar a própria Helena (com confirmação) | Recusa: é a última Administradora ativa | "Tem de existir sempre pelo menos um Administrador ativo." | EC-27 |
| A13 | Membros de "Lançamento do novo site" e "Relatório anual 2025" | Nome e email; Gestor sem "Remover"; "conta desativada" no Rui; no arquivado, só "Remover" | Como esperado | EC-54, RV-31, A-15 |

### 2.2 Gestor (Gestor Teste)

| # | Ação | Resultado esperado | Resultado observado | Requisitos |
|---|---|---|---|---|
| G1 | Entrar com a palavra-passe inicial | Painel com "Verificação do MVP" e contagens 0, 0, 0 | Como esperado | CA-02.1, CA-25.1 |
| G2 | Abrir o projeto a partir do painel | Detalhe do projeto; progresso "Sem tarefas"; lista vazia com mensagem | "Sem tarefas"; "Este projeto ainda não tem tarefas." | CA-25.2, CA-18.5, CA-05.1 |
| G3 | "Nova tarefa" com o título só com espaços | Recusa no campo | "O título é obrigatório." | EC-02 |
| G4 | Criar "Preparar ambiente" (Alta, limite 31/10/2026) | Tarefa na lista, "Em atraso"; progresso e atraso atualizados sem recarregar | 0,0% (0 de 1); "Em atraso: 1"; mensagem de sucesso | CA-11.1, CA-19.1, CA-13.5 |
| G5 | Criar "Rever documentação" (limite 01/11/2026, responsável Membro Teste) | Não fica em atraso (limite igual a hoje); responsável atribuído | Como esperado; ordem por data limite | EC-07, CA-12.1, Q-12 |
| G6 | Filtrar por prioridade "Alta" | Só "Preparar ambiente"; progresso continua com 2 tarefas | Como esperado; "Limpar filtros" visível | CA-23.2, CA-23.3 |
| G7 | Criar "Tarefa a eliminar", abrir e "Eliminar" | Confirmação; depois, volta ao projeto sem a tarefa | Confirmação "Eliminar tarefa"; lista com 2 tarefas | RF-22, EC-10 |
| G8 | "Arquivar" | "Arquivado", aviso de só consulta; sem criar, editar nem mudar estados; nos membros só "Remover" | Botões: "Desarquivar" e "Remover" | CA-08.1, D-09, RV-31 |
| G9 | "Desarquivar" | As ações voltam (nenhum membro noutro projeto ativo) | "Editar projeto", "Arquivar", "Nova tarefa" | CA-08.2, EC-53 |
| G10 | (depois do percurso do Membro) Remover o Membro Teste | As tarefas de que era responsável ficam "Sem responsáveis", sem recarregar | Como esperado (depois da correção C2) | EC-19, RF-06 |

### 2.3 Membro (Membro Teste)

| # | Ação | Resultado esperado | Resultado observado | Requisitos |
|---|---|---|---|---|
| M1 | Abrir o projeto | Sem ações de gestão; seletor de estado só na tarefa de que é responsável; membros só com o nome | Como esperado | RF-11, CA-07.3 |
| M2 | Mudar "Rever documentação" para "Em curso" | Contagens atualizadas sem recarregar | 1 / 1 / 0 | CA-13.2, CA-13.5 |
| M3 | Abrir "Preparar ambiente" (sem responsáveis) e "Juntar-me" | Passa a responsável; ganha o seletor de estado e "Editar descrição" | Como esperado | CA-20.1 |
| M4 | Comentar só com espaços | Recusa no campo | "O comentário não pode estar vazio." | EC-44 |
| M5 | Comentar "Ambiente pronto para a verificação." | Comentário com autor e data e hora do servidor; campo limpo | "Membro Teste · 01/11/2026, 12:19" | CA-24.1, Q-15 |
| M6 | Concluir "Preparar ambiente" e recarregar a página | Estado, responsável e comentário mantêm-se; deixa de estar em atraso | "Concluída", sem atraso; progresso 50,0% (1 de 2) | CA-19.4, CA-12.5, CA-24.3 |
| M7 | Pedir `/api/utilizadores`, `/api/admin/projetos/4/membros` e `/api/projetos/1` | 403, 403 e 404 | 403, 403 e 404 | EC-41, EC-18 |
| M8 | Abrir `/administracao/contas` e `/projetos/1` | Volta ao painel; "Projeto não encontrado." | Como esperado | EC-41, EC-18 |
| M9 | Entrar depois de o Gestor sair, já sem projeto | Painel com "Ainda não pertence a nenhum projeto." | Como esperado (depois da correção C3) | CA-25.3 |

### 2.4 Ecrãs estreitos (375 px)

| # | Ecrã | Resultado esperado | Resultado observado |
|---|---|---|---|
| E1 | Detalhe do projeto (progresso e tarefas) | Sem scroll horizontal; indicadores em grelha; tabela em cartões | Como esperado (I7) |
| E2 | Administração de contas | Sem scroll horizontal; cada conta em cartão | Como esperado |
| E3 | Administração de projetos com "Membros" aberto | Sem scroll horizontal; sem rótulos soltos | ":" solto antes de "Membros" → corrigido (C1) |

### 2.5 Não verificado manualmente

| Caso | Motivo | Cobertura |
|---|---|---|
| EC-31 / CA-01.5 (sessão aberta termina no pedido seguinte quando a conta é desativada) | Exigia duas sessões em navegadores diferentes ao mesmo tempo; a desativação pelo segundo navegador não chegou ao servidor durante o percurso | Teste automático "CA-04.1, EC-31" em `backend/testes/contas.test.ts` |
| CA-04.2 (reativar) | Depende do passo anterior | Testes automáticos "CA-04.2, EC-32" |
| EC-56 (anonimização ao fim de um ano) | Exige que passe um ano | Testes automáticos com a data simulada |

## 3. Testes automáticos

`npm test`: **234 testes, 9 ficheiros, todos a passar** (2 de novembro de 2026). `npm run typecheck -w backend` e `npm run build` sem erros.

A Ficha 4 acrescentou testes unitários, de integração, de segurança, de componentes do frontend e um teste End-to-End. A execução final está em [test-plan.md](test-plan.md), secção 9.

| Ficheiro | O que cobre |
|---|---|
| `bd.test.ts`, `app.test.ts` | Esquema, migrations, seed, persistência e `/api/saude` |
| `sessao.test.ts` | Entrada, saída, sessão expirada, conta desativada |
| `contas.test.ts` | Contas, perfis, desativação e anonimização (I3) |
| `projetos.test.ts`, `membros.test.ts` | Projetos, administração, membros, RV-31 e RV-32 |
| `tarefas.test.ts`, `responsaveis-comentarios.test.ts` | Tarefas, estado, filtros, responsáveis e comentários |
| `progresso.test.ts` | Contagens, percentagem e atrasos (I7) |

## 4. Problemas encontrados e corrigidos no I8

| # | Problema | Correção | Verificação |
|---|---|---|---|
| C1 | Em ecrãs estreitos, a linha de "Membros" na administração de projetos mostrava um ":" solto (o rótulo das células também se aplicava a células sem rótulo) | O rótulo só se aplica a células com `data-rotulo` (`frontend/src/estilos.css`) | E3 |
| C2 | Remover um membro apaga as suas atribuições (EC-19), mas a lista de tarefas e o progresso só se atualizavam ao recarregar | O detalhe do projeto volta a pedir as tarefas e o progresso quando os membros mudam (`Projeto.tsx`, `TarefasProjeto.tsx`, `MembrosProjeto.tsx`) | G10 |
| C3 | Depois de "Sair", quem entrava a seguir voltava à última página do utilizador anterior (por exemplo, "Projeto não encontrado.") | Depois de "Sair", a entrada leva ao painel; se a sessão expirar, continua a voltar à página onde se estava (`ContextoSessao.tsx`, `RotaProtegida.tsx`) | M9 |

## 5. Limitações conhecidas

- A ferramenta de automação do navegador muda caixas de seleção sem disparar o evento do React; no percurso, a caixa do responsável foi marcada com um clique real. Não é um problema da aplicação.
- As mensagens 401 na consola antes de entrar vêm da verificação da sessão ao abrir a aplicação e são esperadas.
- O percurso não mediu o desempenho nem a acessibilidade com leitores de ecrã.

## 6. Verificação do MVP (I9)

Cenários 01 a 09 da Ficha 3, Exercício 8. Cada cenário foi feito na interface e, para as regras de acesso e validação, também com pedidos diretos à API (`fetch` na consola do navegador, com o cookie de sessão da conta indicada).

### 6.1 Ambiente

| Item | Valor |
|---|---|
| Data | 2 de novembro de 2026 |
| Base de dados | `dados/verificacao.sqlite`, separada da base de desenvolvimento, criada com `CAMINHO_BD=dados/verificacao.sqlite npm run bd:migrar` e `CAMINHO_BD=dados/verificacao.sqlite npm run bd:seed` (2 migrations, dados do seed) |
| Arranque | Backend com `CAMINHO_BD=dados/verificacao.sqlite npm run dev -w backend`; interface com `npm run dev -w frontend` |
| Navegador | Navegador da aplicação Claude (Chromium), 1280 px |
| Contas | Contas de demonstração do seed (README, "Contas de demonstração"): Helena (Administrador), Ana e Paulo (Gestores), Marta e João (Membros), Rui (desativado) |
| Identificadores | Projetos: 1 "Lançamento do novo site" (Ana), 2 "Migração do CRM" (Paulo, tarefas 11 e 12), 4 "Verificação I9" (criado no percurso), 5 "Projeto a eliminar" (criado e eliminado). Tarefa 14 "Testar formulários (I9)", criada no percurso |

### 6.2 Cenários

| Caso | Cenário | Resultado esperado | Resultado observado | Evidência | Requisitos |
|---|---|---|---|---|---|
| 01 | Acesso à aplicação | Credenciais válidas permitem entrar; credenciais inválidas, contas desativadas e pedidos sem sessão são recusados; a sessão terminada leva à entrada com mensagem | Como esperado | Formulário vazio: "Indique o email." e "Indique a palavra-passe.", sem pedido. Palavra-passe errada da Ana: "Email ou palavra-passe incorretos.", com o email mantido. Rui (desativado): `POST /sessao` 401 `CREDENCIAIS_INVALIDAS`, a mesma mensagem. Sem sessão: `GET /sessao`, `GET /projetos` e `POST /projetos/1/tarefas` dão 401 `NAO_AUTENTICADO`; `GET /saude` dá 200. Ana entra e vê o painel com os seus 2 projetos. Sessão terminada com `DELETE /sessao` noutro pedido: ao abrir um projeto, a interface volta à entrada com "A sessão terminou. Entre novamente." | CA-01.1 a CA-01.5, EC-20 |
| 02 | Gestão de projetos | Criar, pesquisar, editar e eliminar funcionam de acordo com as permissões | Como esperado, com o problema P1, entretanto corrigido (secções 6.4 e 6.5) | Helena cria "Verificação I9" com Paulo como Gestor: mensagem de sucesso e projeto na lista. Pesquisa "crm": só "Migração do CRM". Eliminar "Lançamento do novo site" com confirmação: recusado, "O projeto tem tarefas e não pode ser eliminado. O Gestor pode arquivá-lo." (`DELETE /admin/projetos/1` 409 `PROJETO_COM_TAREFAS`). "Projeto a eliminar" (sem tarefas): confirmação, depois "foi eliminado." e a lista mostra "Nenhum projeto com "a eliminar" no nome.". Paulo edita o nome para "Verificação I9 (editado)" e o detalhe mostra-o. Marta: `PATCH /projetos/1`, `PUT /projetos/1/arquivado`, `POST /admin/projetos` e `DELETE /admin/projetos/4` dão 403. Ana (não é membro do 4): `GET` e `PATCH /projetos/4` dão 404. Pesquisa com `?nome=`: Ana "verifica" devolve `[]`, Ana "SITE" devolve só o projeto 1, Paulo "verifica" devolve o projeto 4 | CA-05.1, CA-05.2, CA-06.1, CA-22.1 a CA-22.3, EC-10, EC-18, EC-40, EC-41, EC-47 |
| 03 | Persistência de tarefas | A tarefa aparece sem recarregar e mantém-se após reiniciar o backend | Como esperado | Ana cria "Testar formulários (I9)" (Alta) no projeto 1: "Tarefa … criada.", a lista passa a 11 tarefas e o progresso de 6/2/3 sem recarregar. Backend parado (`GET /saude` 502; a página mostra "Ocorreu um erro inesperado. Tente novamente.") e arrancado de novo: a tarefa continua na lista, a sessão continua válida e `GET /projetos/1/tarefas/14` devolve o título, a descrição, `TODO` e `HIGH` | CA-11.1, CA-11.2, CA-11.5, RNF-09 |
| 04 | Validação de dados | Campos obrigatórios vazios ou só com espaços e valores inválidos são recusados | Como esperado | Interface: título da tarefa só com espaços dá "O título é obrigatório." e a descrição mantém-se; nome do projeto só com espaços dá "O nome do projeto é obrigatório." e a descrição mantém-se. API, como Ana: título `""` e `"   "` dão 422 `TITULO_OBRIGATORIO`; título com 201 caracteres dá 422 `LIMITE_EXCEDIDO`; prioridade `URGENTE`, data `31-12-2026` e estado `FEITA` dão 400 `PEDIDO_INVALIDO`; nome do projeto `""` dá 422 `NOME_OBRIGATORIO`; comentário `"   "` dá 422 `CONTEUDO_OBRIGATORIO`. A lista continua com 11 tarefas: nenhum pedido inválido criou registos | EC-01, EC-02, EC-14, EC-29, EC-44, EC-50 |
| 05 | Estado e prioridade | A edição atualiza a tarefa, os filtros e as contagens de forma coerente | Como esperado | Ana muda a tarefa 14 para "Em curso" na lista: contagens de 6/2/3 para 5/3/3. Filtro "Em curso": 3 tarefas, incluindo a 14, e o progresso mantém as 11. Filtros "Em curso" e "Alta": as mesmas 3. Mudar a 14 para "Concluída" com o filtro ativo: sai da lista; 5/2/4 e 36,4% (4 de 11). Prioridade editada para "Baixa" no detalhe: `?prioridade=HIGH` devolve 6, 7 e 8; `?prioridade=LOW` devolve 3, 5 e 14; `?estado=DONE&prioridade=LOW` devolve a 14. O painel inicial e `GET /projetos` mostram 5/2/4 | CA-13.2, CA-13.5, CA-15.1, CA-23.1 a CA-23.4 |
| 06 | Responsáveis | Associar e remover funciona; a mesma associação não fica duplicada | Como esperado | Ana adiciona Marta e depois João à tarefa 14; cada um sai das opções depois de adicionado. API: Marta outra vez dá 409 `RESPONSAVEL_REPETIDO`; Paulo (não é membro), o utilizador 999 (não existe), Helena (Administradora) e Rui (desativado) dão 422 `RESPONSAVEL_INVALIDO`; os responsáveis continuam "João Pires, Marta Lopes". "Remover João Pires": fica só a Marta e o João volta às opções | CA-12.1 a CA-12.4, EC-03, EC-22, EC-30, EC-43 |
| 07 | Comentários | O conteúdo, o autor autenticado e a data ficam guardados e visíveis | Como esperado | Ana comenta na tarefa 14: "Ana Silva · 02/11/2026, 18:48" e o campo fica limpo. API: pedido com `autorId` ou com `criadoEm` dá 400 `PEDIDO_INVALIDO`; 2001 caracteres dá 422 `LIMITE_EXCEDIDO`. Marta comenta: 201, com o autor "Marta Lopes" e a data do servidor. Marta reabre a tarefa: os 2 comentários por ordem e a responsável Marta. Na base: 2 comentários na tarefa 14 | CA-24.1 a CA-24.3, EC-29, EC-44, EC-45 |
| 08 | Autorização na API | Outro utilizador não consegue aceder nem alterar recursos sem permissão, mesmo mudando os identificadores | Como esperado | Marta (membro só do projeto 1): `GET /projetos/2`, `/projetos/2/tarefas` e `/projetos/2/tarefas/11`, a tarefa 11 pelo caminho do projeto 1 (`GET`, `PATCH`, `PUT .../estado`), `POST /projetos/2/tarefas/11/comentarios` e `POST /projetos/2/membros` dão 404 `NAO_ENCONTRADO`. No seu projeto: criar tarefa, editar o título da 14, eliminar a 3, adicionar o João como responsável da 3, `DELETE /projetos/1/tarefas/14/responsaveis/2`, mudar o estado da 4 (não é responsável) e `GET /utilizadores` dão 403 `SEM_PERMISSAO`. Paulo (Gestor do projeto 2): a tarefa 14 pelos caminhos `/projetos/1/...` e `/projetos/2/...` (`GET`, `PATCH`, `DELETE`, `POST .../responsaveis`) dá 404. No fim, a tarefa 14 está igual | CA-13.3, CA-14.3, EC-05, EC-12, EC-18, EC-41, EC-46 |
| 09 | Eliminação e erros | A eliminação respeita as dependências; os erros da API não geram mensagens de sucesso nem perda dos dados do formulário | Como esperado na eliminação e nos formulários, com o problema P1, entretanto corrigido (secções 6.4 e 6.5) | Tarefa 3 ("Por fazer", com o João como responsável e um comentário): confirmação "…apaga também os responsáveis e os comentários da tarefa.", volta ao projeto sem ela e com o progresso em 4 de 10. Na base, 0 linhas da tarefa 3 em `tarefa`, `atribuicao` e `comentario`, e 0 atribuições ou comentários órfãos. Tarefa 6 ("Em curso"): sem botão "Eliminar"; `DELETE` dá 409 `TAREFA_INICIADA`. Tarefa 5 aberta na interface e mudada para "Em curso" por outro pedido: "Eliminar" e confirmação mostram "Só se podem eliminar tarefas por fazer.", sem sucesso, e a página mantém-se. Comentário na tarefa 5 com o backend parado: "Ocorreu um erro inesperado. Tente novamente." e o texto mantém-se; com o backend de novo ativo, o mesmo botão guarda-o uma só vez. Projeto com tarefas: ver o caso 02 | EC-09 a EC-11, EC-13, EC-40, EC-50, RF-22 |

### 6.3 Testes automáticos

| Comando | Resultado |
|---|---|
| `npm test` | 9 ficheiros, **234 testes, todos a passar** |
| `npm run typecheck -w backend` | Sem erros |
| `npm run build` | Sem erros (backend e interface) |
| `npx vitest run --root backend -t "<nomes abaixo>"` | Os 4 testes mínimos passam (230 ignorados pelo filtro) |

Testes mínimos pedidos pela Ficha 3:

| Tipo | Teste | Ficheiro |
|---|---|---|
| Regra de validação | `EC-01, EC-02: título vazio ou só com espaços é recusado (regra de validação)` | `backend/testes/tarefas.test.ts` |
| Autorização | `EC-18: uma tarefa de outro projeto não é encontrada, mesmo mudando o identificador do projeto` | `backend/testes/tarefas.test.ts` |
| Criação com consulta posterior | `CA-24.1, CA-24.3: o autor vem da sessão e a data do servidor; o comentário fica guardado` e `CA-12.5: os responsáveis mantêm-se ao voltar a ler a tarefa (persistência)` | `backend/testes/responsaveis-comentarios.test.ts` |

A persistência num ficheiro entre ligações está coberta por `bd.test.ts` ("persistência em ficheiro (RNF-09)") e, manualmente, pelo reinício do backend no caso 03.

### 6.4 Problemas encontrados

| # | Problema | Reprodução | Causa | Estado |
|---|---|---|---|---|
| P1 | Uma mensagem de sucesso de uma ação anterior fica visível quando uma ação seguinte falha (contra EC-50) | Na administração de projetos, criar um projeto ("… foi criado …") e depois tentar eliminar um projeto com tarefas: o diálogo mostra a recusa e, por cima, continua a mensagem de criação | A mensagem de sucesso só era limpa ao carregar em "Novo projeto" (`AdminProjetos.tsx`). O mesmo padrão existia em `AdminContas.tsx` e `TarefasProjeto.tsx` | Corrigido (secção 6.5) |

### 6.5 Correção do P1

**Correção:** cada linha passa a avisar a página quando começa uma ação (`aoIniciar`), e a página limpa a mensagem de sucesso. Em `AdminProjetos.tsx`: abrir "Membros", "Transferir" ou "Eliminar". Em `AdminContas.tsx`: mudar o perfil, reativar ou abrir "Desativar". Em `TarefasProjeto.tsx`: mudar o estado na lista (`SeletorEstado.tsx` ganhou o `aoIniciar` opcional; o detalhe da tarefa não muda).

**Verificação de regressão (manual, na base de verificação).** O projeto só tem testes automáticos no backend; um teste de interface obrigaria a uma dependência nova, por isso a regressão foi verificada no navegador:

| # | Passos | Antes | Depois da correção |
|---|---|---|---|
| R1 | Helena transfere "Verificação I9 (editado)" para a Ana ("… foi transferido para Ana Silva.") e tenta eliminar "Lançamento do novo site" | Mensagem de sucesso e recusa visíveis ao mesmo tempo | Só a recusa: "O projeto tem tarefas e não pode ser eliminado. O Gestor pode arquivá-lo." |
| R2 | Helena reativa o Rui ("A conta de Rui Costa foi reativada.") e tenta desativar-se a si própria | (mesmo padrão) | A mensagem desaparece ao abrir o diálogo; só a recusa: "Tem de existir sempre pelo menos um Administrador ativo." O Rui voltou a ser desativado no fim |
| R3 | Ana cria "Tarefa P1" ("Tarefa "Tarefa P1" criada."); a tarefa é eliminada por outro pedido; a Ana muda-lhe o estado na lista | (mesmo padrão) | Só o erro "Não encontrado." junto do seletor |

`npx tsc -p frontend/tsconfig.json --noEmit`, `npm test` (234 testes), `npm run typecheck -w backend` e `npm run build` sem erros depois da correção.

**Fica de fora:** no R3, a linha da tarefa eliminada continua na lista até se recarregar ou fazer outra alteração. O erro é mostrado e nenhum dado se perde; não faz parte do P1.

**Atualização (8 de novembro de 2026, Ficha 4):** a linha da tarefa eliminada passou a desaparecer da lista (CR-03, P39). O P1 e o CR-03 têm agora também testes automáticos de componentes do frontend (P41, [test-plan.md](test-plan.md), secção 8).

### 6.6 Verificações manuais e limitações

- **Manual:** os casos 01 a 09 acima, na interface e com pedidos diretos à API. **Automático:** secção 6.3 e secção 3.
- EC-51 (submissão repetida): dois cliques seguidos em "Criar tarefa" criaram uma só tarefa, mas o formulário fecha-se com a resposta, por isso o segundo clique pode não ter chegado a submeter. A proteção está no código (botão desativado enquanto o pedido está em curso, `disabled={aEnviar}` em `FormularioTarefa.tsx` e `ComentariosTarefa.tsx`) e foi revista no I8; não foi possível forçar um pedido lento. Desde a Ficha 4, o EC-51 tem também um teste automático de componentes, com a resposta da API atrasada (P41, [test-plan.md](test-plan.md), secção 8).
- Com o backend parado, o encaminhamento do Vite responde 502 e a interface mostra a mensagem genérica "Ocorreu um erro inesperado. Tente novamente." em vez de "Não foi possível contactar o servidor.". Só acontece em desenvolvimento, por causa do encaminhamento.
- O percurso alterou a base de verificação (projetos 4 e 5, tarefa 14, tarefas 3 e 5, comentários), que foi apagada no fim. A base de desenvolvimento `dados/matriz.sqlite` não foi usada.
- O percurso não mediu o desempenho nem a acessibilidade com leitores de ecrã.

## 7. Revisão e entrega (I10)

Ficha 3, Exercício 9.

### 7.1 Revisão do código

Revisão do código da Ficha 3 (de `01c3e43` até ao I9: 73 ficheiros de `backend/` e `frontend/`), com foco em permissões, validações, tratamento de erros e alterações fora do âmbito. Foram lidos por inteiro os serviços de tarefas e de projetos, a autorização (`autorizacao/index.ts`), os erros (`http/erros.ts`) e a sessão (`http/sessao.ts`, entrada em `contas/servico.ts`).

| Ponto | Resultado |
|---|---|
| Permissões | Cada operação verifica primeiro se o utilizador é membro (404, EC-18) e depois o papel (403), pela ordem de RV-25. A identidade vem sempre da sessão. As rotas `/admin` exigem o perfil Administrador. Coerente com a matriz de permissões e com os casos 02, 06 e 08 da secção 6. |
| Validações | Formato com `zod` em objetos estritos (400, incluindo campos a mais como autor e data, EC-45); regras de negócio com 422 (textos obrigatórios, limites de A-20 e P4, datas, responsáveis e membros). Os limites coincidem no código, no contrato e em `requirements.md` (RNF-03). |
| Erros | Erros de negócio centralizados em `ErroHttp`; erros inesperados dão 500 `ERRO_INTERNO` sem detalhes internos. |
| Segurança | Palavras-passe só como hash `bcryptjs`, com comparação também para emails inexistentes (não revela se a conta existe). O cookie de sessão é aleatório (32 bytes) e só o seu hash SHA-256 fica na base. Cookie `httpOnly` e `SameSite=Lax`. No repositório não há credenciais, além da palavra-passe fictícia de `.env.example`, nem dados pessoais reais. Os registos só têm mensagens de arranque, migrations e anonimização. |
| Âmbito | Não há funcionalidades fora do MVP aprovado. |

Observações, sem alteração (não há regra documentada que as decida):

- O nome do projeto e o nome da conta guardam-se sem espaços nas pontas (P13, P26), mas o título da tarefa e o comentário guardam-se como foram escritos. Uniformizar exigiria uma regra nova, a aprovar. Decidido depois, na Ficha 4: o título da tarefa também se guarda sem espaços nas pontas (CR-02, P38); o comentário continua a guardar-se como foi escrito.
- Na administração de contas, depois de uma ação recusada, o erro continua por baixo da linha até à ação seguinte nessa linha, mesmo que entretanto outra linha mostre uma mensagem de sucesso. Já era assim antes da refatoração (secção 7.2).

### 7.2 Refatoração

**Oportunidade:** cinco componentes repetiam o mesmo bloco para as ações sobre a API: impedir pedidos repetidos (EC-51), marcar "em curso", limpar o erro, `try`/`catch`/`finally` e guardar a mensagem da API (EC-50). Eram `AdminProjetos.tsx` (transferir e eliminar), `AdminContas.tsx` (perfil, desativar e reativar), `SeletorEstado.tsx`, `ResponsaveisTarefa.tsx` e `Tarefa.tsx` (eliminar).

**Decisão:** aplicar, num passo separado (commit `504732a`), com o hook `frontend/src/api/usarAcao.ts`. As regras EC-50 e EC-51 passam a estar num só sítio, e o bloqueio usa uma referência, que impede o segundo pedido mesmo antes de o botão ser desenhado como desativado. Ficaram de fora `MembrosProjeto.tsx` (o "em curso" é por membro) e `ComentariosTarefa.tsx` (valida o texto antes do pedido); o ganho seria pequeno e a mudança maior.

**Verificação de que o comportamento se mantém** (base de verificação nova, `dados/verificacao.sqlite`, criada com o seed):

| Componente | Sucesso | Erro |
|---|---|---|
| `AdminProjetos.tsx` | Transferir "Migração do CRM" para a Ana: mensagem de sucesso e Gestor atualizado na lista. Eliminar um projeto vazio: "… foi eliminado." | "Confirmar" sem escolher: "Escolha o novo Gestor.", sem pedido. Eliminar "Lançamento do novo site": só a recusa, sem a mensagem de sucesso anterior (R1), e os botões do diálogo voltam a ficar ativos |
| `AdminContas.tsx` | Reativar o Rui: "A conta de Rui Costa foi reativada."; mudar o perfil para Gestor: "Rui Costa passou a Gestor." | Desativar a Helena: a mensagem de sucesso desaparece ao abrir o diálogo e fica só "Tem de existir sempre pelo menos um Administrador ativo." (R2) |
| `SeletorEstado.tsx` | "Definir mapa do site" para "Em curso": contagens de 5/2/3 para 4/3/3 | Mudar o estado de uma tarefa eliminada noutro pedido: "Não encontrado." e o seletor volta a ficar ativo (R3) |
| `ResponsaveisTarefa.tsx` | Adicionar e remover o João na tarefa 2 | Adicionar o João depois de outro pedido o ter adicionado: "Este utilizador já é responsável pela tarefa." e o botão volta a ficar ativo |
| `Tarefa.tsx` | Eliminar a tarefa 4 ("Por fazer"): volta ao projeto, sem a tarefa, com 8 tarefas no progresso | Eliminar a tarefa 5, iniciada noutro pedido: "Só se podem eliminar tarefas por fazer." e os botões do diálogo voltam a ficar ativos |

Sem avisos do React na consola. `npx tsc -p frontend/tsconfig.json --noEmit`, `npm test` (234), `npm run typecheck -w backend` e `npm run build` sem erros.

### 7.3 Contrato e documentação

| Verificação | Resultado |
|---|---|
| Operações | As 35 operações do `openapi.yaml` correspondem às 35 rotas do backend. |
| Estados de sucesso | Os 12 que não são 200 (201 nas criações, 204 nas eliminações e em `DELETE /sessao`) coincidem. |
| Códigos de erro | Todos os códigos do contrato existem no backend. O `ERRO_INTERNO` (500) existia só no backend: acrescentado à lista de códigos de erro do contrato. |
| Limites de tamanho | Iguais no código (backend e interface), no contrato e em `requirements.md`. |
| Modelo de dados | As 8 tabelas da migration 001 e as colunas da 002 (`desativado_em`, `anonimizado_em`) estão em `database.md`. |

`AGENTS.md`: acrescentados `npm start`, `/api/saude` e o uso de uma base separada nas verificações manuais; o `npm run build` já verificava os tipos do frontend, o que ficou explícito.

### 7.4 Execução a partir de uma cópia limpa

Num clone do repositório (commit `504732a`) numa pasta temporária, seguindo só o `README.md`, com Node.js 26.13.0:

| Passo | Resultado |
|---|---|
| `npm install` | Concluído; só o aviso do `esbuild` já descrito no README |
| `cp .env.example .env` | Sem alterações ao ficheiro |
| `npm run bd:migrar` (duas vezes) | 2 migrations aplicadas; à segunda, "O esquema já estava atualizado." |
| `npm run bd:seed` (duas vezes) | Dados criados; à segunda, "A base de dados já tem contas; o seed não alterou nada." |
| `npm test` | 234 testes a passar |
| `npm run typecheck -w backend` e `npm run build` | Sem erros |
| `npm start` | Backend compilado a responder: `/api/saude` devolve `{"estado":"ok","baseDeDados":"ok","migrations":2}`; a entrada da Ana dá 200; `/api/projetos` sem sessão dá 401 |

O README não precisou de correções. O `npm run dev` (interface e backend juntos) foi usado durante todo o I8 e o I9.

### 7.5 Exemplos de uso da IA

| # | Objetivo do pedido | Decisão do programador | Verificação |
|---|---|---|---|
| IA1 | Verificar se o projeto estava conforme as Fichas 1, 2 e 3 | A IA indicou a tabela das contas de demonstração partida no README (uma linha separada da tabela por uma nota). Aceite, e o resto da análise foi usado para planear o I9 e o I10 | A tabela passou a ter todas as contas; commit `b956b24` |
| IA2 | Executar os cenários 01 a 09 (I9) | A IA encontrou o P1 (mensagem de sucesso antiga visível depois de uma recusa, contra EC-50) e propôs uma correção. O programador só aprovou a correção depois de ver o diagnóstico, e escolheu a verificação de regressão manual em vez de acrescentar uma dependência de testes de interface | Casos R1 a R3 (secção 6.5) antes e depois da correção; commit `b2d3d1b` |
| IA3 (sugestão corrigida) | Durante o I9, verificar a pesquisa de projetos pela API | A IA concluiu primeiro que a pesquisa devolvia projetos que não correspondiam ao texto. Antes de o registar como problema, consultou o contrato: tinha usado o parâmetro `pesquisa` em vez de `nome`, e o backend ignora parâmetros que não conhece. A conclusão foi corrigida e não houve alteração ao código | Com `?nome=`, a pesquisa deu os resultados esperados (caso 02 da secção 6.2) |
