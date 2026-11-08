# Matriz — Restrições, pressupostos e pendentes

Versão 1.10 · 8 de novembro de 2026 · a 1.3 acrescentou Q-12, Q-13 e a revisão crítica do Architecture Pack (RV-24 a RV-30); a 1.4 acrescenta a conciliação com a Ficha 3 (Q-14 a Q-22); a 1.5 (1 de novembro de 2026) acrescenta RV-31, que altera R-07 e D-09, RV-32, sobre o papel do Administrador, RV-33, sobre a remoção de contas desativadas, e RV-34, com os detalhes das duas; a 1.6 (2 de novembro de 2026) corrige incoerências: o estado da implementação, as regras das palavras-passe e da sessão (já aprovadas em P2 e P3) e o título que agrupava RV-31 a RV-34 com a revisão do Architecture Pack; a 1.7 (8 de novembro de 2026) acrescenta RV-35, o limite de tentativas de entrada (SEG-01); a 1.8 (8 de novembro de 2026) confirma a duração do bloqueio de RV-35 e acrescenta RV-36 a RV-40, decisões sobre a segunda revisão de segurança (SEG-03 a SEG-08); a 1.9 (8 de novembro de 2026) acrescenta RV-41, a aprovação do Architecture Pack, e a questão Q-23, por decidir; a 1.10 (8 de novembro de 2026) regista a decisão da Q-23 (EC-59).

> **Origem da informação.** O cliente é fictício. A única informação confirmada é a frase original do cliente (C-00). Todos os outros pontos são pressupostos da dona do produto: estão aprovados para orientar o desenvolvimento, mas **não são requisitos confirmados pelo cliente**.
>
> Os documentos "Âmbito funcional e MVP" v0.1 e "Backlog inicial do MVP" v0.1, citados como origem de D-xx e A-xx, foram versões de trabalho anteriores e não estão no repositório. O seu conteúdo aprovado está consolidado neste ficheiro e em [requirements.md](requirements.md).
>
> - Os requisitos (RF-xx, RNF-xx) estão em [requirements.md](requirements.md).
> - Os critérios de aceitação (CA-xx.x, EC-xx) estão em [user-stories.md](user-stories.md).

## 1. Restrições conhecidas

- **Cliente fictício.** Só a frase original (C-00) está confirmada. A dona do produto assume o papel de cliente e é a única responsável pela aprovação (R-06).
- **Implementação concluída.** O MVP foi implementado nos incrementos I0 a I10 de [implementation-plan.md](implementation-plan.md) e verificado em [verification.md](verification.md); a versão entregue tem a tag `entrega-ficha3`. Os testes e a revisão de qualidade e de segurança da Ficha 4 estão em [test-plan.md](test-plan.md) e [quality-security-review.md](quality-security-review.md); a versão final tem a tag `entrega-ficha4`.
- **Stack.** Node.js e TypeScript, Express, React e SQLite (Q-14), sobre a arquitetura de monólito modular ([architecture.md](architecture.md)). Os requisitos e as User Stories continuam sem referir tecnologias.
- **Prazo.** O piloto tem um prazo de 3 meses (R-05).
- **IDs estáveis.** Os IDs (C, RF, RNF, US, CA, EC, R, G, D, A, Q, RV) não são renumerados. IDs novos são acrescentados no fim de cada série.

## 2. Pressupostos assumidos

**Informação confirmada**

| ID | Informação | Estado |
|---|---|---|
| C-00 | *"Precisamos de uma aplicação onde as nossas equipas possam organizar projetos, gerir tarefas e acompanhar o progresso do trabalho."* | Confirmado pelo cliente |

**Estados possíveis:** Aprovado · Aprovado (alterado) · Aprovado (complementado por A-xx, Q-xx ou RV-xx) · Decidido · Rejeitado · Por decidir.

### Respostas às perguntas de clarificação

| ID | Pressuposto | Estado |
|---|---|---|
| R-01 | Problema: as equipas gerem o trabalho em Excel e email; ninguém sabe ao certo o estado de cada projeto. | Aprovado |
| R-02 | Sucesso: os Gestores da equipa piloto deixam de pedir pontos de situação por email; todas as tarefas ativas estão na Matriz. Tarefa ativa: qualquer trabalho da equipa ainda não terminado. | Aprovado (complementado por RV-08) |
| R-03 | Primeira versão: criar projetos, gerir tarefas com estado e responsável, ver o progresso de cada projeto. | Aprovado |
| R-04 | Utilizadores iniciais: uma equipa piloto de 10 a 20 pessoas. | Aprovado |
| R-05 | Prazo: 3 meses para o piloto. | Aprovado |
| R-06 | Aprovação: um responsável único do lado do cliente (a dona do produto). | Aprovado |
| R-07 | Um projeto tem uma equipa (os seus membros); uma pessoa pode estar em vários projetos; não há tarefas fora de projetos. | Aprovado (alterado por RV-31: quem não tem o perfil Gestor só é membro de um projeto ativo de cada vez) |
| R-08 | Perfis: Administrador (gere utilizadores), Gestor de projeto (cria projetos e atribui tarefas), Membro (atualiza as suas tarefas). | Aprovado (complementado por RV-02; alterado por Q-18: quem cria projetos é o Administrador) |
| R-09 | Progresso por projeto: número de tarefas em cada estado, percentagem concluída e tarefas em atraso. | Aprovado |
| R-10 | Tarefa: título (obrigatório), descrição, responsável, prioridade, data limite, estado. | Aprovado (complementado por A-19, A-20; alterado por Q-20: vários responsáveis) |
| R-11 | Estados fixos: Por fazer, Em curso, Concluída. Mudam o estado o responsável da tarefa e o Gestor do projeto. | Aprovado |
| R-12 | Projeto: nome, descrição, datas opcionais; no fim é arquivado, não apagado. | Aprovado (complementado por A-05, A-12; alterado por Q-19: um projeto sem tarefas pode ser eliminado pelo Administrador) |

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
| D-02 | As contas são desativadas em vez de apagadas. | Aprovado (complementado por RV-04, RV-18; alterado por RV-33: um ano depois da desativação, a conta é anonimizada automaticamente) |
| D-03 | "Gestor" é um perfil global; o Gestor gere os projetos de que é Gestor. | Aprovado (alterado por A-03 e Q-18) |
| D-04 | Uma pessoa pode acumular perfis. | Aprovado (alterado por RV-32: o perfil Administrador não se acumula com o perfil Gestor nem com o perfil Membro) |
| D-05 | O Administrador só vê projetos de que é membro. | Aprovado (complementado por A-02; alterado por RV-32: o Administrador nunca é membro; vê o nome, o Gestor e os membros de todos os projetos, sem o seu conteúdo) |
| D-06 | O nome do projeto é obrigatório. | Aprovado |
| D-07 | O Gestor pode editar os dados do projeto. | Aprovado |
| D-08 | O Gestor adiciona e remove membros do projeto. | Aprovado |
| D-09 | Um projeto arquivado fica só de consulta; é o Gestor quem arquiva. | Aprovado (complementado por A-04, A-05; alterado por RV-31: o Gestor pode remover membros de um projeto arquivado) |
| D-10 | Cada utilizador só vê os projetos a que pertence. | Aprovado |
| D-11 | Só o Gestor cria tarefas. | Aprovado |
| D-12 | O responsável tem de ser membro do projeto. | Aprovado (complementado por A-15, RV-02, Q-20) |
| D-13 | Uma tarefa nova começa em "Por fazer"; qualquer transição é permitida, incluindo reabrir. | Aprovado |
| D-14 | O Membro edita apenas o estado e a descrição das tarefas de que é responsável. | Aprovado |
| D-15 | O Gestor edita todos os campos das tarefas dos seus projetos. | Aprovado |
| D-16 | A lista de tarefas por projeto faz parte do MVP. | Aprovado |
| D-17 | Percentagem concluída: tarefas concluídas sobre o total. | Aprovado (complementado por A-09, RV-12) |
| D-18 | Atraso: data limite ultrapassada e estado diferente de Concluída. | Aprovado (complementado por A-08) |
| D-19 | Valores da prioridade: Alta, Média, Baixa. | Aprovado (complementado por A-19) |
| D-20 | Durante 2 semanas consecutivas, os Gestores da equipa piloto não enviam nem recebem pedidos de ponto de situação por email. | Aprovado (alterado pela dona do produto; alinhado com R-02 por RV-08) |
| D-21 | Classificação MoSCoW de RF-19 a RF-29. | Aprovado (alterado: RF-22 passou de Could para Must) |
| D-22 | O Administrador pode transferir um projeto para outro Gestor (RF-30). | Aprovado (complementado por RV-01, RV-13) |
| D-23 | RF-01 a RF-18, RF-22 e RF-30 são Must: implementam a primeira versão definida em R-03 e as correções aprovadas na revisão do Exercício 2. | Aprovado (RV-19; alargado por Q-15 a Q-19: RF-24, RF-32 a RF-35) |

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
| A-09 | A percentagem é arredondada às décimas; 100% só quando todas as tarefas estão concluídas; um projeto sem tarefas mostra "Sem tarefas". | Aprovado (alterado por RV-12) |
| A-10 | Eliminar uma tarefa pede confirmação e é definitivo. | Aprovado |
| A-11 | Só se pode eliminar uma tarefa em "Por fazer". | Aprovado (alterado por RV-10) |
| A-12 | A data de fim de um projeto tem de ser igual ou posterior à de início. | Aprovado |
| A-13 | Pode arquivar-se um projeto com tarefas por concluir; as tarefas mantêm o estado. | Aprovado |
| A-14 | As tarefas de um membro removido do projeto ficam sem responsável. | Aprovado (alterado por Q-20: são removidas só as atribuições desse membro) |
| A-15 | As tarefas de um utilizador desativado mantêm a atribuição com o aviso "conta desativada"; um utilizador desativado não pode ser escolhido como responsável. | Aprovado (mantido com vários responsáveis, Q-20) |
| A-16 | O Administrador tem de transferir os projetos de um Gestor antes de o desativar. | Aprovado (âmbito confirmado em Q-07) |
| A-17 | A regra de A-16 aplica-se também a retirar o perfil de Gestor. | Aprovado (âmbito confirmado em Q-07) |
| A-18 | Tem de existir sempre pelo menos 1 Administrador ativo. | Aprovado |
| A-19 | A prioridade é obrigatória, com valor por omissão Média. | Aprovado (mantido por RV-20) |
| A-20 | Título da tarefa até 200 caracteres, nome do projeto até 100, descrições até 5000. | Aprovado |
| A-21 | Ao adicionar membros, o Gestor vê a lista de utilizadores ativos (nome e email). | Aprovado (mantido: RV-14 rejeitada) |
| A-22 | O critério de sucesso do piloto é verificado fora da aplicação: a dona do produto confirma semanalmente com o gestor do piloto. | Aprovado (complementado por RV-08) |

### Questões da consolidação

Questões levantadas ao consolidar a documentação, já decididas pela dona do produto.

| ID | Questão | Decisão | Onde se aplica | Estado |
|---|---|---|---|---|
| Q-01 | Um título composto apenas por espaços conta como vazio? | Sim, conta como vazio. Aplica-se também ao nome do projeto (RV-15). | RF-04, RF-09, EC-02 | Decidido |
| Q-02 | Ordem de entrega das User Stories. | A coluna "Ordem" é o plano de entrega aprovado. | user-stories.md, secção 1 | Decidido |
| Q-03 | O que acontece quando um texto excede o limite de tamanho? | Não é guardado e é indicado o limite excedido. | RNF-03, EC-29 | Decidido |
| Q-04 | Depois de uma transferência, o Gestor anterior continua como membro do projeto? | Sim, como membro sem permissões de Gestor; mantém as tarefas de que é responsável. | RF-30, EC-25 | Decidido |
| Q-05 | O Gestor pode ser removido dos membros do seu próprio projeto? | Não; para deixar o projeto, este tem de ser transferido. | RF-06, EC-28 | Decidido |
| Q-06 | Um utilizador só com o perfil Administrador pode ser adicionado como membro de um projeto? | Sim; nesse projeto tem as permissões de Membro. | RF-06, EC-30 | Decidido (alterado por RV-32: não; o Administrador nunca é membro de um projeto) |
| Q-07 | A-16 e A-17 abrangem também os projetos arquivados? | Sim, abrangem todos os projetos, ativos e arquivados. | RF-02, RF-03, EC-23, EC-26 | Decidido |
| Q-08 | Que dados tem uma conta além de nome e email? | No MVP, apenas nome e email. Complementado por Q-22: a conta guarda também o hash da palavra-passe. | requirements.md, secção 2 | Decidido |
| Q-09 | Numa transferência, o novo Gestor passa a membro do projeto, se ainda não o for? | Sim, na mesma operação da transferência, para cumprir A-01. Levantada no modelo de dados (Ficha 02). | RF-30, EC-37, database.md | Decidido |
| Q-10 | A unicidade do email ignora maiúsculas e minúsculas? | Sim: emails que só diferem em maiúsculas e minúsculas contam como o mesmo email. Levantada no modelo de dados (Ficha 02). | RF-02, RV-18, EC-38, database.md | Decidido |
| Q-11 | Pode adicionar-se um utilizador com conta desativada como membro de um projeto? | Não: só se adicionam utilizadores com conta ativa, coerente com A-21. Levantada no modelo de dados (Ficha 02). | RF-06, A-21, EC-39, database.md | Decidido |
| Q-12 | Por que ordem aparecem as tarefas na lista do projeto e na lista em atraso? | Lista do projeto: por estado (Por fazer, Em curso, Concluída) e, dentro de cada estado, por data limite crescente, com as tarefas sem data limite no fim. Lista em atraso: por data limite crescente. Não exige dados novos. Levantada no wireframe (Ficha 02, RV-26). | RF-15, RF-18, CA-17.3, CA-19.5, openapi.yaml, docs/ui/ | Decidido |
| Q-13 | Um membro do projeto pode ver quem são os outros membros? | Sim, só pelo nome, sem email; não alarga a exposição de emails (RV-14). Levantada na revisão do Architecture Pack (RV-29). | RF-06, requirements.md secção 3, CA-07.3, docs/ui/ | Decidido |

### Conciliação com o âmbito da Ficha 3

A Ficha Prática 03 define um âmbito funcional que tinha de ser conciliado com o MVP aprovado antes de implementar (Exercício 1). A dona do produto decidiu cada diferença.

| ID | Questão | Decisão | Onde se aplica | Estado |
|---|---|---|---|---|
| Q-14 | Que stack tecnológica se usa? | Node.js 26 e TypeScript no backend e no frontend; backend com Express; frontend com React e Vite; base de dados SQLite, através do módulo `node:sqlite`; testes com Vitest e Supertest. Começou como Node.js 24 LTS; mudou para o Node.js 26, a versão instalada, por decisão da dona do produto no Exercício 2. | architecture.md, implementation-plan.md | Decidido |
| Q-15 | Os comentários em tarefas entram no MVP? | Sim (RF-24 passa a Must). Qualquer membro do projeto adiciona e lista comentários; o autor e a data são obtidos no backend; não se comenta num projeto arquivado (D-09). | RF-24, US-24 | Decidido |
| Q-16 | A pesquisa e os filtros entram no MVP? | Sim: pesquisar projetos pelo nome (RF-33) e filtrar tarefas por estado e prioridade (RF-34). Os outros filtros e a escolha da ordem continuam fora (RF-21). | RF-33, RF-34, US-22, US-23 | Decidido |
| Q-17 | Há um painel inicial? | Sim (RF-35): o ecrã inicial mostra os projetos do utilizador com a contagem de tarefas por estado e ligação ao detalhe. A visão geral completa do Gestor continua fora (RF-20). | RF-35, US-25, CA-01.1 | Decidido |
| Q-18 | Quem cria projetos? | Só o Administrador. Ao criar, indica o Gestor do projeto: perfil Gestor, conta ativa e sem perfil Administrador (RV-01). O Gestor deixa de criar projetos. | R-08, D-03, RF-04, US-05, CA-03.1, CA-03.2 | Decidido |
| Q-19 | Um projeto pode ser eliminado? | Sim, pelo Administrador, só se não tiver tarefas, com confirmação e de forma definitiva. Os projetos com tarefas arquivam-se (RF-07). | R-12, RF-32, US-21, EC-40 | Decidido |
| Q-20 | Uma tarefa pode ter vários responsáveis? | Sim. O Gestor adiciona e remove responsáveis, membros do projeto com conta ativa, sem repetir. Um membro pode juntar-se a uma tarefa sem responsáveis e sair das tarefas de que é responsável. Todos os responsáveis mudam o estado e a descrição. | R-10, D-12, A-14, A-15, RF-10, RF-11, RF-13, US-12, US-20 | Decidido |
| Q-21 | Que valores usa a API para o estado e a prioridade? | Códigos técnicos: `TODO`, `IN_PROGRESS`, `DONE` e `LOW`, `MEDIUM`, `HIGH`. A interface mostra Por fazer, Em curso, Concluída e Baixa, Média, Alta (RNF-01). | RF-09, RF-11, openapi.yaml, database.md | Decidido |
| Q-22 | Como funciona a autenticação? | Email e palavra-passe, guardada só como hash. Sessão guardada no servidor e identificada por um cookie httpOnly; cada pedido relê o estado atual da conta (RV-09). O Administrador define a palavra-passe inicial ao criar a conta. Contas de demonstração criadas por seed. | RF-01, RF-02, US-01, openapi.yaml, database.md | Decidido |

### Questões levantadas na Ficha 4

Levantadas depois da conciliação com a Ficha 3 e decididas pela dona do produto.

| ID | Questão | Decisão | Onde se aplica | Estado |
|---|---|---|---|---|
| Q-23 | Uma conta anonimizada perde os perfis (P27), incluindo o perfil Gestor, mas continua membro dos seus projetos (RV-34). Se era membro de mais de um projeto ativo, fica fora da regra de RV-31 (um só projeto ativo para quem não tem o perfil Gestor), e desarquivar um desses projetos era recusado (409 `MEMBRO_NOUTRO_PROJETO`, EC-53) até o Gestor remover a "Conta removida". O que deve acontecer? Levantada na segunda revisão de segurança (SEG-05, [quality-security-review.md](quality-security-review.md), secção 7.5). | Decisão da dona do produto (08/11/2026): uma conta anonimizada não conta para a regra de RV-31. Continua membro dos seus projetos, para o histórico (RV-34), mas não impede desarquivar um projeto (EC-59). Uma conta só desativada continua a contar, porque pode ser reativada: assim, ao ser reativada, nunca fica em mais de um projeto ativo sem o perfil Gestor. Uma conta anonimizada continua sem poder ser reativada (RV-34); se a pessoa voltar, o Administrador cria-lhe uma conta nova. | RV-31, RV-34, RF-03, RF-06, EC-53, EC-56, EC-59, database.md (regras 19 e 21) | Decidido (implementado) |

### Decisões da revisão crítica

Resultado da revisão independente da documentação (Exercício 6). A dona do produto decidiu cada ponto; nem todas as correções propostas foram aceites.

| ID | Problema | Decisão | Onde se aplica | Estado |
|---|---|---|---|---|
| RV-01 | O Administrador podia dar a si próprio o perfil Gestor e transferir para si qualquer projeto, anulando D-05 e A-02. | O Administrador não pode ser destino de uma transferência nem atribuir a si próprio o perfil Gestor. | RF-02, RF-30, EC-35, EC-36 | Decidido (alterado) |
| RV-02 | "Membro" usado como perfil global e como papel no projeto, sem se saber o que o perfil dá. | Todos os utilizadores têm o perfil Membro, que não se retira; ser membro de um projeto depende só do Gestor. O membro pode atribuir-se uma tarefa sem responsável e largá-la; continua sem poder criar tarefas. | RF-02, RF-10, US-20, EC-34 | Decidido (alterado; alterado por RV-32: o Administrador não tem o perfil Membro) |
| RV-03 | Várias User Stories sem critério de aceitação de sucesso. | Acrescentar pelo menos um CA de sucesso por US. | user-stories.md | Decidido |
| RV-04 | Contas nunca apagadas fixam retenção indefinida de dados pessoais. | D-02 e RNF-07 ficam dependentes da decisão sobre retenção e requisitos legais. | RF-03, RNF-07, secção 3 | Decidido (prazo e anonimização decididos em RV-33) |
| RV-05 | A coluna Administrador da matriz não refletia Q-06. | A coluna aplica-se aos projetos de que o Administrador não é membro. | requirements.md, secção 3 | Decidido (substituído por RV-32: o Administrador nunca é membro) |
| RV-06 | CA-01.1 remetia para a matriz inteira. | A matriz é verificada pelos CA e EC de cada US; CA-01.1 fica restrito ao acesso. | CA-01.1 | Decidido |
| RV-07 | RF-03 atribuía a D-02 uma regra sobre "histórico" que D-02 não diz. | Removida; aplica-se A-15. | RF-03 | Decidido |
| RV-08 | "Tarefa ativa" indefinida e R-02 desalinhado de D-20. | Tarefa ativa = trabalho da equipa ainda não terminado. Verificação: a dona do produto confirma com o gestor do piloto que não há tarefas a ser geridas em Excel. | R-02, D-20, requirements.md secção 6 | Decidido (alterado) |
| RV-09 | Não se sabia se sessões abertas perdiam o acesso após desativação ou perda de perfil. | Efeito no pedido seguinte, incluindo sessões abertas. | RF-01, EC-31 | Decidido |
| RV-10 | A-11 permitia eliminar qualquer tarefa, contra o motivo de US-16. | Só se elimina uma tarefa em "Por fazer". | A-11, RF-22, EC-13 | Decidido (alterado) |
| RV-11 | Não estava definido como surge o primeiro Administrador. | A primeira conta é criada pela dona do produto e fica Administrador. | RF-02, CA-02.2 | Decidido (alterado) |
| RV-12 | Arredondamento ao inteiro permitia 100% com tarefas por concluir. | Arredondamento às décimas; 100% só com todas as tarefas concluídas. A Definition of Done por tarefa fica fora do MVP (RF-31). | A-09, RF-17, CA-18.x | Decidido (alterado) |
| RV-13 | O destino de uma transferência podia ter a conta desativada. | O destino tem de ter conta ativa. | RF-30, EC-24 | Decidido |
| RV-14 | O Gestor vê nome e email de todos os utilizadores ativos. | Rejeitada a correção: risco aceite. Uso interno de uma só empresa (G-02) e o email de trabalho já é conhecido internamente. A alternativa proposta entrava em conflito com A-02. | A-21, secção 3 | Rejeitado |
| RV-15 | Q-01 só cobria o título da tarefa e a criação. | Estendido ao nome do projeto e à edição. | Q-01, EC-02 | Decidido |
| RV-16 | EC-29 não cobria o Membro a editar uma descrição. | Os limites aplicam-se a qualquer utilizador. | RNF-03, EC-29 | Decidido |
| RV-17 | Não se sabia se um membro lê descrições de tarefas alheias. | Sim, qualquer membro lê a descrição de todas as tarefas do projeto. | RF-15, CA-17.2 | Decidido (alterado) |
| RV-18 | Não se dizia se a desativação é reversível nem se o email é único. | A desativação é reversível (o Administrador reativa); o email é único. | RF-02, RF-03, EC-32, EC-33 | Decidido (alterado) |
| RV-19 | A classificação Must não tinha origem registada. | Registada em D-23. | D-23 | Decidido |
| RV-20 | Prioridade obrigatória e datas do projeto sem efeito no MVP. | Mantêm-se, por serem úteis à equipa. | A-19, RF-04, RF-09 | Decidido (alterado) |
| RV-21 | US-03 dependia de US-10, entregue depois. | US-10 passa para a ordem 2. | user-stories.md, secção 1 | Decidido (alterado) |
| RV-22 | README e AGENTS.md desatualizados um em relação ao outro. | Atualizadas as duas referências. | README.md, AGENTS.md | Decidido |
| RV-23 | A regra 6 do AGENTS.md omitia séries de IDs. | Alinhada com a secção 1 deste ficheiro. | AGENTS.md | Decidido |

### Decisões da revisão crítica do Architecture Pack

Resultado da revisão da coerência entre requisitos, arquitetura, dados, API e wireframe (Ficha 02, Exercício 5). A dona do produto decidiu cada ponto.

| ID | Problema | Decisão | Onde se aplica | Estado |
|---|---|---|---|---|
| RV-24 | O diagrama de componentes mostrava o Progresso a ler a base de dados diretamente, contra a regra de os módulos não usarem as tabelas de outro módulo. | O Progresso lê as tarefas através da interface do módulo de Tarefas. | architecture.md, secção 4 | Decidido |
| RV-25 | Não estava definido que erro se devolve quando um pedido tem vários problemas (ex.: Membro a criar uma tarefa num projeto arquivado). | Ordem de verificação: 401, 404, 403, 409, 400, 422. As permissões são verificadas antes do conteúdo do pedido. | openapi.yaml | Decidido |
| RV-26 | A ordem da lista de tarefas e da lista em atraso não estava definida. | Decidida em Q-12. | Q-12 | Decidido |
| RV-27 | O wireframe usa operações que o contrato não documenta (listar tarefas, dados do projeto, atribuir responsável, eliminar). | Listadas no openapi.yaml como operações por documentar; corrigida a validação do wireframe. | openapi.yaml, docs/ui/wireframe.md | Decidido |
| RV-28 | O wireframe não mostrava como abrir uma tarefa para ler a descrição (CA-17.2). | O título da tarefa é um link para o detalhe. | docs/ui/ | Decidido |
| RV-29 | Não estava definido se um membro vê os outros membros do projeto. | Decidida em Q-13. | Q-13 | Decidido |
| RV-30 | O diagrama ER não dizia que a unicidade do email ignora maiúsculas e minúsculas (Q-10). | Acrescentado ao comentário do atributo. | database.md, secção 3 | Decidido |

### Revisões da dona do produto durante a implementação

Decisões de 1 de novembro de 2026, tomadas durante a implementação (Ficha 3), depois da revisão do Architecture Pack, e de 8 de novembro de 2026, depois da revisão de segurança (Ficha 4, RV-35 a RV-40) e na revisão de conformidade com as Fichas 1 a 4 (RV-41). Continuam a série RV.

| ID | Problema | Decisão | Onde se aplica | Estado |
|---|---|---|---|---|
| RV-31 | R-07 deixava qualquer pessoa estar em vários projetos ativos. | Decisão da dona do produto (01/11/2026): quem não tem o perfil Gestor só é membro de um projeto ativo de cada vez; os projetos arquivados não contam. Quem tem o perfil Gestor não tem limite. Para mudar de projeto, o Gestor do projeto atual remove a pessoa e o Gestor do outro projeto adiciona-a. A lista de candidatos só mostra, de quem não tem o perfil Gestor, quem não está em nenhum projeto ativo. Desarquivar é recusado se um membro sem o perfil Gestor estiver noutro projeto ativo; para o permitir, abre-se uma exceção a D-09: o Gestor pode remover membros de um projeto arquivado. | R-07, D-09, RF-06, EC-52, EC-53, P22 | Decidido (alterado; complementado por Q-23: as contas anonimizadas não contam) |
| RV-32 | Q-06 deixava o Administrador ser membro de projetos, misturando a administração da plataforma com o trabalho nos projetos. | Decisão da dona do produto (01/11/2026): o Administrador só administra a plataforma e nunca é membro de um projeto; não tem o perfil Membro nem o perfil Gestor (os dois não se acumulam, a aplicar no I3). Além das contas, dos perfis, da criação, eliminação e transferência de projetos, adiciona e remove membros de qualquer projeto, com as regras do Gestor: só contas ativas (Q-11), um só projeto ativo para quem não tem o perfil Gestor (RV-31), o Gestor só se substitui por transferência (Q-05, RF-30) e, num projeto arquivado, remove mas não adiciona (D-09). Para isso vê os membros de cada projeto com nome e email; as tarefas, os comentários e o progresso continuam fora do seu acesso. | Q-06, RV-05, RV-02, D-04, D-05, RF-06, EC-30, EC-54, P23, P24 | Decidido (alterado) |
| RV-33 | As contas desativadas ficavam guardadas para sempre (RV-04). | Decisão da dona do produto (01/11/2026): um ano depois da desativação, a conta é anonimizada automaticamente: o nome e o email são apagados, e os comentários e as atribuições mantêm-se com "Conta removida". A implementar no I3, com a data de desativação guardada numa migration nova. | D-02, RF-03, RNF-07, RV-04 | Decidido (alterado) |
| RV-34 | RV-32 e RV-33 deixavam casos por definir nas contas. | Decisão da dona do produto ao aprovar o plano do I3 (01/11/2026): (1) atribuir o perfil Administrador a quem é membro de projetos é recusado até a pessoa ser removida de todos; (2) uma conta anonimizada continua membro dos seus projetos, como "Conta removida", e mantém as atribuições; (3) reativar uma conta antes de passar um ano cancela a anonimização, e o prazo recomeça numa nova desativação; (4) as contas anonimizadas continuam na lista do Administrador, marcadas "Conta removida", sem ações e sem reativação. | RV-32, RV-33, RF-02, RF-03, EC-55, EC-56, P25 a P28 | Decidido |
| RV-35 | A entrada não tinha limite de tentativas: era possível adivinhar uma palavra-passe por tentativa e erro (SEG-01, [quality-security-review.md](quality-security-review.md)). | Decisão da dona do produto (08/11/2026): só são permitidas 5 tentativas de entrada falhadas por conta. Contam as falhas no mesmo email nos últimos 15 minutos, venham de onde vierem; uma entrada com sucesso repõe o contador. À 5.ª falha, a entrada nessa conta fica bloqueada temporariamente, durante 15 minutos (duração confirmada a 08/11/2026), e depois volta a ser possível sem ação do Administrador. | RF-01, US-01, EC-57, P29, SEG-01, SEG-04 | Decidido (implementado) |
| RV-36 | Retirar o perfil Gestor a quem é membro de vários projetos ativos deixava a pessoa a violar RV-31 (SEG-05). | Decisão da dona do produto (08/11/2026): retirar o perfil Gestor é recusado (422) enquanto a pessoa for membro de mais de um projeto ativo; o Administrador ou os Gestores removem-na primeiro dos outros projetos. | RV-31, RF-02, CA-03.2, EC-58, P31, SEG-05 | Decidido (implementado) |
| RV-37 | O primeiro Administrador só podia ser criado pelo seed de demonstração, com uma palavra-passe de exemplo publicada no repositório (RV-11, SEG-03). | Decisão da dona do produto (08/11/2026): um comando próprio cria a primeira conta de Administrador numa Matriz sem contas, com nome, email e palavra-passe indicados no momento, sem dados de demonstração. O seed de demonstração recusa correr em produção e com o valor de exemplo da palavra-passe. | RV-11, CA-02.2, P10, P30, SEG-03 | Decidido (implementado) |
| RV-38 | O bcrypt só usa os primeiros 72 bytes da palavra-passe: o resto era ignorado sem aviso (SEG-07). | Decisão da dona do produto (08/11/2026): a palavra-passe tem no máximo 72 bytes em UTF-8; acima disso, a criação da conta é recusada (422) com o limite. Complementa P3. | P3, RF-02, P31, SEG-07 | Decidido (implementado) |
| RV-39 | A unicidade do email só ignorava maiúsculas em letras sem acento (Q-10, SEG-08). | Decisão da dona do produto (08/11/2026): o email guarda-se e procura-se em minúsculas, incluindo as letras acentuadas; as contas existentes são convertidas. | Q-10, RV-18, EC-33, P32, SEG-08 | Decidido (implementado) |
| RV-40 | Uma conta com um email `removida-<id>@matriz.invalid` impedia a anonimização das contas desativadas (SEG-06). | Decisão da dona do produto (08/11/2026): não se criam contas com emails do domínio reservado `.invalid` (422); a anonimização trata cada conta em separado, para uma falha não impedir as outras. | RV-33, P25, P27, P31, P33, SEG-06 | Decidido (implementado) |
| RV-41 | A arquitetura, o modelo de dados, o contrato OpenAPI e o wireframe continuavam como proposta, por aprovar (R-06), embora a implementação já assentasse neles. | Decisão da dona do produto (08/11/2026): os quatro artefactos ficam aprovados, na versão em vigor nesta data. Os pressupostos que cada documento assinala como por aprovar continuam por aprovar. | R-06, architecture.md, database.md, openapi.yaml, docs/ui/wireframe.md | Decidido |

## 3. Segurança e privacidade

**Regras aprovadas:**
- Só utilizadores com conta individual ativa acedem à aplicação; não há acesso anónimo (RF-01, D-01).
- Desativar uma conta, remover um membro ou retirar um perfil produz efeito no pedido seguinte, incluindo em sessões abertas (RV-09).
- Pessoas externas à empresa não têm acesso (G-03).
- Cada utilizador só vê os projetos a que pertence (D-10). O Administrador nunca é membro e não vê o conteúdo dos projetos; para criar, eliminar, transferir e gerir membros, vê o nome, o Gestor e os membros (nome e email) de cada projeto (D-05, A-02, Q-18, Q-19, RV-32).
- O Administrador não pode atribuir a si próprio o perfil Gestor nem ser destino de uma transferência (RV-01).
- As ações permitidas a cada perfil estão na matriz de permissões de [requirements.md](requirements.md#3-matriz-de-permissões).
- Tem de existir sempre pelo menos 1 Administrador ativo (A-18).
- **Palavras-passe e sessão:** a palavra-passe tem pelo menos 8 caracteres e no máximo 72 bytes (RV-38) e, no MVP, só o Administrador a define, ao criar a conta (P3); a sessão expira após 8 horas sem atividade (P2); depois de 5 tentativas de entrada falhadas numa conta em 15 minutos, a entrada nessa conta fica bloqueada durante 15 minutos (RV-35). Ver [implementation-plan.md](implementation-plan.md#2-propostas-técnicas-aprovadas).
- **Dados pessoais conhecidos:** nome e email dos utilizadores. O email é único (RV-18) e fica visível aos Gestores ao adicionarem membros (A-21) e ao Administrador ao gerir membros (RV-32). Um ano depois da desativação, o nome e o email são apagados (RV-33).
- **Autenticação (Q-22):** email e palavra-passe; a palavra-passe é guardada só como hash, nunca em claro. A sessão fica no servidor e o cookie é httpOnly. A identidade do utilizador, o autor dos comentários e o Gestor indicado são sempre validados no backend, nunca aceites como prova enviada pelo cliente.
- **Configuração:** as credenciais e os segredos ficam em variáveis de ambiente, fora do repositório; o repositório tem só um ficheiro de exemplo com valores fictícios. As contas de demonstração usam dados fictícios e só se criam em desenvolvimento, nunca com a palavra-passe de exemplo; no piloto, a primeira conta de Administrador é criada por um comando próprio (RV-37).

**Riscos aceites:**
- Dois Administradores podem contornar RV-01 em conjunto: um retira ao outro o perfil Administrador e dá-lhe o perfil Gestor, e este passa a poder receber transferências. Aceite para o MVP; a rever quando se decidir o registo de auditoria (RV-01).
- Os Gestores veem o nome e o email de todos os utilizadores ativos da empresa (RV-14).

**Por definir:**
- Requisitos legais de proteção de dados pessoais aplicáveis. O prazo de retenção das contas desativadas e a anonimização estão decididos em RV-33; falta confirmar que cumprem os requisitos legais (RV-04).
- Registo de acessos ou de auditoria: é necessário?
- Cópias de segurança.

## 4. Decisões técnicas pendentes

Já decididos: a arquitetura (monólito modular, [architecture.md](architecture.md)), a stack (Q-14) e o método de autenticação (Q-22). O efeito imediato das alterações de acesso (RV-09) fica garantido porque a sessão está no servidor e cada pedido relê a conta, os perfis e os papéis. A estratégia de testes está em [implementation-plan.md](implementation-plan.md).

Continuam pendentes:
- Alojamento da aplicação e localização dos dados.
- Como cumprir os valores de desempenho, disponibilidade e acessibilidade, ainda por definir (RNF-08).

## 5. Limitações de âmbito

- O MVP cobre apenas RF-01 a RF-18, RF-22, RF-24, RF-30 e RF-32 a RF-35 (D-23, Q-15 a Q-19). As funcionalidades excluídas estão em [requirements.md](requirements.md#7-fora-do-âmbito-inicial).
- O piloto envolve uma só equipa, de 10 a 20 pessoas (R-04).
- Os dados atuais em Excel não são importados no MVP; a importação é RF-26, fora do âmbito.
- O critério de sucesso do piloto é verificado fora da aplicação (A-22).
- A Definition of Done por tarefa fica fora do MVP (RF-31, RV-12).
- A especificação reflete apenas pressupostos da dona do produto. Um cliente real poderia invalidar qualquer ponto exceto C-00.