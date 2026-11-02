# Matriz — Verificação

Versão 0.1 · 2 de novembro de 2026 · Ficha Prática 03, Exercício 7 (incremento I8)

> **Estado:** percurso manual completo do I8, feito na interface com a API e a base de dados reais. Os cenários 01 a 09 da Ficha 3 (Exercício 8, incremento I9) acrescentam-se a este ficheiro. As verificações manuais estão separadas dos testes automáticos (secção 3).

**Fontes:** [user-stories.md](user-stories.md) (CA e EC), [requirements.md](requirements.md) (RF), [constraints.md](constraints.md) (RV), [implementation-plan.md](implementation-plan.md) (I8).

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
