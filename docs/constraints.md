# Matriz — Restrições, pressupostos e pendentes

Versão 1.0 · 25 de outubro de 2026

> **Origem da informação.** O cliente é fictício. A única informação confirmada é a frase original do cliente (C-00). Todos os outros pontos são pressupostos da dona do produto: estão aprovados para orientar o desenvolvimento, mas **não são requisitos confirmados pelo cliente**.
>
> - Os requisitos (RF-xx, RNF-xx) estão em [requirements.md](requirements.md).
> - Os critérios de aceitação (CA-xx.x, EC-xx) estão em [user-stories.md](user-stories.md).

## 1. Restrições conhecidas

- **Cliente fictício.** Só a frase original (C-00) está confirmada. A dona do produto assume o papel de cliente e é a única responsável pela aprovação (R-06).
- **Fase de especificação.** Não há código nesta fase.
- **Stack por decidir.** A stack tecnológica e a arquitetura são decididas na Aula 2. Os documentos de especificação não referem tecnologias.
- **Prazo.** O piloto tem um prazo de 3 meses (R-05).
- **IDs estáveis.** Os IDs (RF, RNF, US, CA, EC, R, G, D, A, Q) não são renumerados. IDs novos são acrescentados no fim de cada série.

## 2. Pressupostos assumidos

**Informação confirmada**

| ID | Informação | Estado |
|---|---|---|
| C-00 | *"Precisamos de uma aplicação onde as nossas equipas possam organizar projetos, gerir tarefas e acompanhar o progresso do trabalho."* | Confirmado pelo cliente |

**Estados possíveis:** Aprovado · Aprovado (alterado) · Aprovado (complementado por A-xx ou Q-xx) · Decidido.

### Respostas às perguntas de clarificação

| ID | Pressuposto | Estado |
|---|---|---|
| R-01 | Problema: as equipas gerem o trabalho em Excel e email; ninguém sabe ao certo o estado de cada projeto. | Aprovado |
| R-02 | Sucesso: os gestores deixam de pedir pontos de situação por email; todas as tarefas ativas estão na Matriz. | Aprovado |
| R-03 | Primeira versão: criar projetos, gerir tarefas com estado e responsável, ver o progresso de cada projeto. | Aprovado |
| R-04 | Utilizadores iniciais: uma equipa piloto de 10 a 20 pessoas. | Aprovado |
| R-05 | Prazo: 3 meses para o piloto. | Aprovado |
| R-06 | Aprovação: um responsável único do lado do cliente (a dona do produto). | Aprovado |
| R-07 | Um projeto tem uma equipa (os seus membros); uma pessoa pode estar em vários projetos; não há tarefas fora de projetos. | Aprovado |
| R-08 | Perfis: Administrador (gere utilizadores), Gestor de projeto (cria projetos e atribui tarefas), Membro (atualiza as suas tarefas). | Aprovado |
| R-09 | Progresso por projeto: número de tarefas em cada estado, percentagem concluída e tarefas em atraso. | Aprovado |
| R-10 | Tarefa: título (obrigatório), descrição, responsável, prioridade, data limite, estado. | Aprovado (complementado por A-19, A-20) |
| R-11 | Estados fixos: Por fazer, Em curso, Concluída. Mudam o estado o responsável da tarefa e o Gestor do projeto. | Aprovado |
| R-12 | Projeto: nome, descrição, datas opcionais; no fim é arquivado, não apagado. | Aprovado (complementado por A-05, A-12) |

### Pressupostos gerais

| ID | Pressuposto | Estado |
|---|---|---|
| G-01 | Aplicação web. | Aprovado |
| G-02 | Uso interno de uma só empresa. | Aprovado |
| G-03 | Sem acesso de pessoas externas. | Aprovado |
| G-04 | Interface em português. | Aprovado |

### Decisões do documento "Âmbito funcional e MVP" v0.1

| ID | Pressuposto | Estado |
|---|---|---|
| D-01 | O acesso é feito com conta individual; não há acesso anónimo. | Aprovado |
| D-02 | As contas são desativadas em vez de apagadas. | Aprovado |
| D-03 | "Gestor" é um perfil global; o Gestor gere os projetos de que é Gestor. | Aprovado (alterado por A-03) |
| D-04 | Uma pessoa pode acumular perfis. | Aprovado |
| D-05 | O Administrador só vê projetos em que participa. | Aprovado (complementado por A-02) |
| D-06 | O nome do projeto é obrigatório. | Aprovado |
| D-07 | O Gestor pode editar os dados do projeto. | Aprovado |
| D-08 | O Gestor adiciona e remove membros do projeto. | Aprovado |
| D-09 | Um projeto arquivado fica só de consulta; é o Gestor quem arquiva. | Aprovado (complementado por A-04, A-05) |
| D-10 | Cada utilizador só vê os projetos a que pertence. | Aprovado |
| D-11 | Só o Gestor cria tarefas. | Aprovado |
| D-12 | O responsável tem de ser membro do projeto. | Aprovado (complementado por A-15) |
| D-13 | Uma tarefa nova começa em "Por fazer"; qualquer transição é permitida, incluindo reabrir. | Aprovado |
| D-14 | O Membro edita apenas o estado e a descrição das tarefas de que é responsável. | Aprovado |
| D-15 | O Gestor edita todos os campos das tarefas dos seus projetos. | Aprovado |
| D-16 | A lista de tarefas por projeto faz parte do MVP. | Aprovado |
| D-17 | Percentagem concluída: tarefas concluídas sobre o total. | Aprovado (complementado por A-09) |
| D-18 | Atraso: data limite ultrapassada e estado diferente de Concluída. | Aprovado (complementado por A-08) |
| D-19 | Valores da prioridade: Alta, Média, Baixa. | Aprovado (complementado por A-19) |
| D-20 | Durante 2 semanas consecutivas, o gestor do piloto não envia nem recebe pedidos de ponto de situação por email. | Aprovado (alterado pela dona do produto) |
| D-21 | Classificação MoSCoW de RF-19 a RF-29. | Aprovado (alterado: RF-22 passou de Could para Must) |
| D-22 | O Administrador pode transferir um projeto para outro Gestor (RF-30). | Aprovado |

### Decisões sobre as ambiguidades do backlog

| ID | Pressuposto | Estado |
|---|---|---|
| A-01 | O Gestor é membro do próprio projeto e pode ser responsável por tarefas. | Aprovado |
| A-02 | Para transferir projetos, o Administrador vê apenas o nome e o Gestor de cada projeto, sem acesso ao conteúdo. | Aprovado |
| A-03 | D-03 passa a "o Gestor gere os projetos de que é Gestor". | Aprovado |
| A-04 | Pode transferir-se um projeto arquivado. | Aprovado |
| A-05 | O Gestor pode desarquivar um projeto. | Aprovado |
| A-06 | Os projetos arquivados aparecem na lista, marcados como "Arquivado", depois dos ativos. | Aprovado |
| A-07 | É permitido criar tarefas com data limite no passado; ficam logo em atraso. | Aprovado |
| A-08 | No próprio dia da data limite a tarefa não está em atraso; fuso horário Europe/Lisbon. | Aprovado |
| A-09 | A percentagem é arredondada ao inteiro mais próximo; um projeto sem tarefas mostra "Sem tarefas". | Aprovado |
| A-10 | Eliminar uma tarefa pede confirmação e é definitivo. | Aprovado |
| A-11 | Pode eliminar-se uma tarefa em qualquer estado. | Aprovado |
| A-12 | A data de fim de um projeto tem de ser igual ou posterior à de início. | Aprovado |
| A-13 | Pode arquivar-se um projeto com tarefas por concluir; as tarefas mantêm o estado. | Aprovado |
| A-14 | As tarefas de um membro removido do projeto ficam sem responsável. | Aprovado |
| A-15 | As tarefas de um utilizador desativado mantêm a atribuição com o aviso "conta desativada"; um utilizador desativado não pode ser escolhido como responsável. | Aprovado |
| A-16 | O Administrador tem de transferir os projetos de um Gestor antes de o desativar. | Aprovado (âmbito confirmado em Q-07) |
| A-17 | A regra de A-16 aplica-se também a retirar o perfil de Gestor. | Aprovado (âmbito confirmado em Q-07) |
| A-18 | Tem de existir sempre pelo menos 1 Administrador ativo. | Aprovado |
| A-19 | A prioridade é obrigatória, com valor por omissão Média. | Aprovado |
| A-20 | Título da tarefa até 200 caracteres, nome do projeto até 100, descrições até 5000. | Aprovado |
| A-21 | Ao adicionar membros, o Gestor vê a lista de utilizadores ativos (nome e email). | Aprovado |
| A-22 | O critério de sucesso do piloto é verificado fora da aplicação: a dona do produto confirma semanalmente com o gestor do piloto. | Aprovado |

### Questões da consolidação

Questões levantadas ao consolidar a documentação, já decididas pela dona do produto.

| ID | Questão | Decisão | Onde se aplica | Estado |
|---|---|---|---|---|
| Q-01 | Um título composto apenas por espaços conta como vazio? | Sim, conta como vazio. | RF-09, EC-02 | Decidido |
| Q-02 | Ordem de entrega das User Stories. | A coluna "Ordem" é o plano de entrega aprovado. | user-stories.md, secção 1 | Decidido |
| Q-03 | O que acontece quando um texto excede o limite de tamanho? | Não é guardado e é indicado o limite excedido. | RNF-03, EC-29 | Decidido |
| Q-04 | Depois de uma transferência, o Gestor anterior continua como membro do projeto? | Sim, como membro sem permissões de Gestor; mantém as tarefas de que é responsável. | RF-30, EC-25 | Decidido |
| Q-05 | O Gestor pode ser removido dos membros do seu próprio projeto? | Não; para deixar o projeto, este tem de ser transferido. | RF-06, EC-28 | Decidido |
| Q-06 | Um utilizador só com o perfil Administrador pode ser adicionado como membro de um projeto? | Sim; nesse projeto tem as permissões de Membro. | RF-06, EC-30 | Decidido |
| Q-07 | A-16 e A-17 abrangem também os projetos arquivados? | Sim, abrangem todos os projetos, ativos e arquivados. | RF-02, RF-03, EC-23, EC-26 | Decidido |
| Q-08 | Que dados tem uma conta além de nome e email? | No MVP, apenas nome e email. | requirements.md, secção 2 | Decidido |

## 3. Segurança e privacidade

**Regras aprovadas:**
- Só utilizadores com conta individual ativa acedem à aplicação; não há acesso anónimo (RF-01, D-01).
- Pessoas externas à empresa não têm acesso (G-03).
- Cada utilizador só vê os projetos a que pertence (D-10). O Administrador não vê o conteúdo de projetos em que não participa; para transferir, vê apenas o nome e o Gestor (D-05, A-02).
- As ações permitidas a cada perfil estão na matriz de permissões de [requirements.md](requirements.md#3-matriz-de-permissões).
- A desativação de uma conta retira-lhe o acesso (RF-03).
- Tem de existir sempre pelo menos 1 Administrador ativo (A-18).
- **Dados pessoais conhecidos:** nome e email dos utilizadores. O email fica visível aos Gestores ao adicionarem membros (A-21).

**Por definir:**
- Método de autenticação e regras para as credenciais.
- Requisitos legais de proteção de dados pessoais aplicáveis.
- Registo de acessos ou de auditoria: é necessário?
- Cópias de segurança e prazos de retenção dos dados.

## 4. Decisões técnicas pendentes

A decidir a partir da Aula 2. Não há soluções propostas nesta fase.

- Stack tecnológica e arquitetura.
- Alojamento da aplicação e localização dos dados.
- Método de autenticação (secção 3).
- Como cumprir os valores de desempenho, disponibilidade e acessibilidade, ainda por definir (RNF-08).
- Estratégia de testes para verificar os critérios CA-xx.x e EC-xx.

## 5. Limitações de âmbito

- O MVP cobre apenas RF-01 a RF-18, RF-22 e RF-30. As funcionalidades excluídas estão em [requirements.md](requirements.md#7-fora-do-âmbito-inicial).
- O piloto envolve uma só equipa, de 10 a 20 pessoas (R-04).
- Os dados atuais em Excel não são importados no MVP; a importação é RF-26, fora do âmbito.
- O critério de sucesso do piloto é verificado fora da aplicação (A-22).
- A especificação reflete apenas pressupostos da dona do produto. Um cliente real poderia invalidar qualquer ponto exceto C-00.