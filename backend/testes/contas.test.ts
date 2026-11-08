// Testes do incremento I3: contas e perfis (RF-02, RF-03, US-02 a US-04) e anonimização (RV-33, RV-34).
// Seed: Helena (Administrador), Ana e Paulo (Gestores, com projetos), Marta e João (Membros), Rui (desativado).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { motivoParaRecusarSeed, semear } from '../src/bd/seed.js';
import { ErroHttp } from '../src/http/erros.js';
import { anonimizarContasExpiradas, umAnoAntes } from '../src/modulos/contas/anonimizacao.js';
import { criarPrimeiraConta } from '../src/modulos/contas/gestao.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';
const DIA_MS = 24 * 60 * 60 * 1000;

let bd: Bd;
let app: ReturnType<typeof criarApp>;

beforeEach(() => {
  bd = abrirBd(':memory:');
  aplicarMigrations(bd);
  semear(bd, PALAVRA_PASSE);
  app = criarApp({ bd });
});
afterEach(() => bd.close());

const EMAILS = {
  helena: 'helena.matos@matriz.test',
  ana: 'ana.silva@matriz.test',
  paulo: 'paulo.reis@matriz.test',
  marta: 'marta.lopes@matriz.test',
  joao: 'joao.pires@matriz.test',
  rui: 'rui.costa@matriz.test',
};
type Pessoa = keyof typeof EMAILS;

const entrar = (email: string, palavraPasse = PALAVRA_PASSE) =>
  request.agent(app).post('/api/sessao').send({ email, palavraPasse });

async function como(pessoa: Exclude<Pessoa, 'rui'>): Promise<request.Agent> {
  const agente = request.agent(app);
  const resposta = await agente.post('/api/sessao').send({ email: EMAILS[pessoa], palavraPasse: PALAVRA_PASSE });
  expect(resposta.status).toBe(200);
  return agente;
}

const id = (pessoa: Pessoa) => Number(bd.prepare('SELECT id FROM utilizador WHERE email = ?').get(EMAILS[pessoa])?.id);
const projeto = (nome: string) => Number(bd.prepare('SELECT id FROM projeto WHERE nome = ?').get(nome)?.id);
const SITE = () => projeto('Lançamento do novo site');
const CRM = () => projeto('Migração do CRM');
const RELATORIO = () => projeto('Relatório anual 2025');
const conta = (corpo: Partial<{ nome: string; email: string; palavraPasse: string; perfis: string[] }> = {}) => ({
  nome: 'Sofia Ramos',
  email: 'sofia.ramos@matriz.test',
  palavraPasse: 'inicial-1234',
  perfis: [],
  ...corpo,
});

// ---------------------------------------------------------------- GET /utilizadores

describe('GET /utilizadores', () => {
  it('lista todas as contas: ativas e depois desativadas, por nome (P26), sem a palavra-passe (EC-49)', async () => {
    const resposta = await (await como('helena')).get('/api/utilizadores');
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((c: { nome: string }) => c.nome)).toEqual([
      'Ana Silva',
      'Helena Matos',
      'João Pires',
      'Marta Lopes',
      'Paulo Reis',
      'Rui Costa',
    ]);
    expect(resposta.body[0]).toEqual({
      id: id('ana'),
      nome: 'Ana Silva',
      email: EMAILS.ana,
      perfis: ['GESTOR'],
      ativo: true,
      removida: false,
    });
    expect(resposta.body.at(-1)).toMatchObject({ nome: 'Rui Costa', ativo: false, removida: false });
    expect(resposta.text).not.toMatch(/palavra|hash|\$2[aby]\$/i);
  });

  it('EC-41: só o Administrador; os outros perfis recebem 403 e sem sessão 401', async () => {
    expect((await (await como('ana')).get('/api/utilizadores')).status).toBe(403);
    expect((await (await como('marta')).get('/api/utilizadores')).status).toBe(403);
    expect((await request(app).get('/api/utilizadores')).status).toBe(401);
  });
});

// ---------------------------------------------------------------- POST /utilizadores

describe('POST /utilizadores', () => {
  it('CA-02.1: a conta fica ativa, com o perfil escolhido, e entra com a palavra-passe inicial', async () => {
    const resposta = await (await como('helena')).post('/api/utilizadores').send(conta({ perfis: ['GESTOR'] }));
    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      id: expect.any(Number),
      nome: 'Sofia Ramos',
      email: 'sofia.ramos@matriz.test',
      perfis: ['GESTOR'],
      ativo: true,
      removida: false,
    });
    const sessao = await entrar('sofia.ramos@matriz.test', 'inicial-1234');
    expect(sessao.status).toBe(200);
    expect(sessao.body.perfis).toEqual(['GESTOR']);
  });

  it('CA-03.1: uma conta criada com o perfil Gestor pode ser indicada como Gestor', async () => {
    const helena = await como('helena');
    await helena.post('/api/utilizadores').send(conta({ perfis: ['GESTOR'] }));
    const elegiveis = (await helena.get('/api/utilizadores/gestores-elegiveis')).body;
    expect(elegiveis.map((g: { email: string }) => g.email)).toContain('sofia.ramos@matriz.test');
  });

  it('EC-49: a palavra-passe guarda-se só como hash e nunca é devolvida', async () => {
    const resposta = await (await como('helena')).post('/api/utilizadores').send(conta());
    expect(resposta.text).not.toContain('inicial-1234');
    const hash = String(bd.prepare('SELECT palavra_passe_hash FROM utilizador WHERE id = ?').get(resposta.body.id)?.palavra_passe_hash);
    expect(hash).not.toContain('inicial-1234');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('P26: o nome e o email guardam-se sem espaços no início e no fim', async () => {
    const resposta = await (await como('helena'))
      .post('/api/utilizadores')
      .send(conta({ nome: '  Sofia Ramos ', email: ' sofia.ramos@matriz.test  ' }));
    expect(resposta.body).toMatchObject({ nome: 'Sofia Ramos', email: 'sofia.ramos@matriz.test' });
  });

  it('EC-33, EC-38: email repetido, mesmo com maiúsculas diferentes ou de uma conta desativada', async () => {
    const helena = await como('helena');
    for (const email of [EMAILS.ana, 'Ana.Silva@Matriz.Test', EMAILS.rui]) {
      const resposta = await helena.post('/api/utilizadores').send(conta({ email }));
      expect(resposta.status).toBe(422);
      expect(resposta.body).toEqual({ codigo: 'EMAIL_REPETIDO', mensagem: 'Já existe uma conta com este email.', campo: 'email' });
    }
  });

  it('P25: nome, email e palavra-passe validados no backend', async () => {
    const helena = await como('helena');
    const codigo = async (corpo: object) => (await helena.post('/api/utilizadores').send(conta(corpo))).body;
    expect(await codigo({ nome: '   ' })).toMatchObject({ codigo: 'NOME_OBRIGATORIO', campo: 'nome' });
    expect(await codigo({ email: ' ' })).toMatchObject({ codigo: 'EMAIL_OBRIGATORIO', campo: 'email' });
    expect(await codigo({ email: 'sofia@matriz' })).toMatchObject({ codigo: 'EMAIL_INVALIDO', campo: 'email' });
    expect(await codigo({ email: 'sofia matriz.test' })).toMatchObject({ codigo: 'EMAIL_INVALIDO' });
    expect(await codigo({ palavraPasse: '1234567' })).toMatchObject({ codigo: 'PALAVRA_PASSE_CURTA', campo: 'palavraPasse' });
    expect(Number(bd.prepare("SELECT COUNT(*) AS n FROM utilizador WHERE nome LIKE 'Sofia%'").get()?.n)).toBe(0);
  });

  it('RV-32: os perfis Administrador e Gestor não se acumulam', async () => {
    const resposta = await (await como('helena')).post('/api/utilizadores').send(conta({ perfis: ['ADMIN', 'GESTOR'] }));
    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ codigo: 'PERFIS_INCOMPATIVEIS', campo: 'perfis' });
  });

  it('pedido mal formado responde 400 (perfil repetido, perfil desconhecido, campo a mais)', async () => {
    const helena = await como('helena');
    expect((await helena.post('/api/utilizadores').send(conta({ perfis: ['GESTOR', 'GESTOR'] }))).status).toBe(400);
    expect((await helena.post('/api/utilizadores').send(conta({ perfis: ['MEMBRO'] }))).status).toBe(400);
    expect((await helena.post('/api/utilizadores').send({ ...conta(), ativo: false })).status).toBe(400);
  });

  it('EC-41: um Gestor recebe 403', async () => {
    expect((await (await como('ana')).post('/api/utilizadores').send(conta())).status).toBe(403);
  });
});

// ---------------------------------------------------------------- PATCH /utilizadores/{id}: perfis

describe('PATCH /utilizadores/{id} — perfis', () => {
  const alterar = async (pessoaId: number, corpo: object) =>
    (await como('helena')).patch(`/api/utilizadores/${pessoaId}`).send(corpo);

  it('CA-03.1: a Marta recebe o perfil Gestor e passa a poder ser indicada como Gestora', async () => {
    const resposta = await alterar(id('marta'), { perfis: ['GESTOR'] });
    expect(resposta.status).toBe(200);
    expect(resposta.body.perfis).toEqual(['GESTOR']);
    const elegiveis = (await (await como('helena')).get('/api/utilizadores/gestores-elegiveis')).body;
    expect(elegiveis.map((g: { id: number }) => g.id)).toContain(id('marta'));
  });

  it('EC-26: não se retira o perfil Gestor a quem ainda gere projetos', async () => {
    const resposta = await alterar(id('paulo'), { perfis: [] });
    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({ codigo: 'GESTOR_COM_PROJETOS', mensagem: 'Transfira primeiro todos os projetos deste Gestor.' });
  });

  it('CA-03.2: depois de transferir os projetos, retira-se o perfil Gestor e a pessoa continua membro', async () => {
    const helena = await como('helena');
    expect((await helena.put(`/api/admin/projetos/${CRM()}/gestor`).send({ gestorId: id('ana') })).status).toBe(200);
    const resposta = await helena.patch(`/api/utilizadores/${id('paulo')}`).send({ perfis: [] });
    expect(resposta.status).toBe(200);
    expect(resposta.body.perfis).toEqual([]);
    const elegiveis = (await helena.get('/api/utilizadores/gestores-elegiveis')).body;
    expect(elegiveis.map((g: { id: number }) => g.id)).not.toContain(id('paulo'));
    expect((await (await como('paulo')).get(`/api/projetos/${CRM()}`)).status).toBe(200);
  });

  it('EC-36: o Administrador não atribui a si próprio o perfil Gestor', async () => {
    for (const perfis of [['GESTOR'], ['ADMIN', 'GESTOR']]) {
      const resposta = await alterar(id('helena'), { perfis });
      expect(resposta.status).toBe(422);
      expect(resposta.body.codigo).toBe('GESTOR_PROPRIO');
    }
  });

  it('RV-32: os perfis Administrador e Gestor não se acumulam', async () => {
    const resposta = await alterar(id('ana'), { perfis: ['ADMIN', 'GESTOR'] });
    expect(resposta.body.codigo).toBe('PERFIS_INCOMPATIVEIS');
  });

  it('EC-55: o perfil Administrador é recusado a quem é membro de projetos, até sair de todos', async () => {
    const recusa = await alterar(id('marta'), { perfis: ['ADMIN'] });
    expect(recusa.status).toBe(422);
    expect(recusa.body).toMatchObject({ codigo: 'ADMINISTRADOR_COM_PROJETOS', campo: 'perfis' });

    const ana = await como('ana');
    expect((await ana.delete(`/api/projetos/${SITE()}/membros/${id('marta')}`)).status).toBe(204);
    expect((await ana.delete(`/api/projetos/${RELATORIO()}/membros/${id('marta')}`)).status).toBe(204);
    const aceite = await alterar(id('marta'), { perfis: ['ADMIN'] });
    expect(aceite.status).toBe(200);
    expect(aceite.body.perfis).toEqual(['ADMIN']);
  });

  it('EC-27: o último Administrador ativo não perde o perfil nem é desativado; com outro, pode', async () => {
    expect((await alterar(id('helena'), { perfis: [] })).body.codigo).toBe('ULTIMO_ADMINISTRADOR');
    expect((await alterar(id('helena'), { ativo: false })).body.codigo).toBe('ULTIMO_ADMINISTRADOR');

    const helena = await como('helena');
    await helena.post('/api/utilizadores').send(conta({ perfis: ['ADMIN'] }));
    const resposta = await helena.patch(`/api/utilizadores/${id('helena')}`).send({ perfis: [] });
    expect(resposta.status).toBe(200);
    expect(resposta.body.perfis).toEqual([]);
  });

  it('EC-31, RV-09: quem perde o perfil Administrador perde o acesso à administração no pedido seguinte', async () => {
    const helena = await como('helena');
    const outra = (await helena.post('/api/utilizadores').send(conta({ perfis: ['ADMIN'] }))).body;
    const sofia = request.agent(app);
    await sofia.post('/api/sessao').send({ email: outra.email, palavraPasse: 'inicial-1234' });
    expect((await sofia.get('/api/utilizadores')).status).toBe(200);
    await helena.patch(`/api/utilizadores/${outra.id}`).send({ perfis: [] });
    expect((await sofia.get('/api/utilizadores')).status).toBe(403);
  });

  it('conta inexistente responde 404 e pedido vazio ou mal formado 400', async () => {
    expect((await alterar(9999, { ativo: false })).status).toBe(404);
    expect((await alterar(id('marta'), {})).status).toBe(400);
    expect((await alterar(id('marta'), { ativo: 'nao' })).status).toBe(400);
  });

  it('EC-41: um Gestor recebe 403', async () => {
    expect((await (await como('ana')).patch(`/api/utilizadores/${id('marta')}`).send({ perfis: ['GESTOR'] })).status).toBe(403);
  });
});

// ---------------------------------------------------------------- PATCH /utilizadores/{id}: ativar e desativar

describe('PATCH /utilizadores/{id} — desativar e reativar', () => {
  it('CA-04.1, EC-31: a conta desativada deixa de entrar e perde a sessão aberta no pedido seguinte', async () => {
    const joao = await como('joao');
    const resposta = await (await como('helena')).patch(`/api/utilizadores/${id('joao')}`).send({ ativo: false });
    expect(resposta.status).toBe(200);
    expect(resposta.body.ativo).toBe(false);
    expect((await joao.get('/api/projetos')).status).toBe(401);
    expect((await entrar(EMAILS.joao)).status).toBe(401);
    expect(bd.prepare('SELECT desativado_em FROM utilizador WHERE id = ?').get(id('joao'))?.desativado_em).not.toBeNull();
  });

  it('A-15: desativar não tira a pessoa dos projetos nem das tarefas', async () => {
    await (await como('helena')).patch(`/api/utilizadores/${id('joao')}`).send({ ativo: false });
    const membros = (await (await como('ana')).get(`/api/projetos/${SITE()}/membros`)).body;
    expect(membros).toContainEqual({ id: id('joao'), nome: 'João Pires', contaAtiva: false });
  });

  it('EC-23: não se desativa quem ainda gere projetos', async () => {
    const resposta = await (await como('helena')).patch(`/api/utilizadores/${id('ana')}`).send({ ativo: false });
    expect(resposta.status).toBe(422);
    expect(resposta.body.codigo).toBe('GESTOR_COM_PROJETOS');
  });

  it('CA-04.2, EC-32: a conta reativada volta a entrar, sem o aviso "conta desativada", e limpa a data (RV-34)', async () => {
    const resposta = await (await como('helena')).patch(`/api/utilizadores/${id('rui')}`).send({ ativo: true });
    expect(resposta.body.ativo).toBe(true);
    expect((await entrar(EMAILS.rui)).status).toBe(200);
    const membros = (await (await como('ana')).get(`/api/projetos/${SITE()}/membros`)).body;
    expect(membros).toContainEqual({ id: id('rui'), nome: 'Rui Costa', contaAtiva: true });
    expect(bd.prepare('SELECT desativado_em FROM utilizador WHERE id = ?').get(id('rui'))?.desativado_em).toBeNull();
  });
});

// ---------------------------------------------------------------- Anonimização (RV-33, RV-34)

describe('anonimização das contas desativadas há mais de um ano (RV-33, EC-56)', () => {
  const daquiA = (dias: number) => new Date(Date.now() + dias * DIA_MS);
  const desativar = async (pessoa: Pessoa) =>
    (await como('helena')).patch(`/api/utilizadores/${id(pessoa)}`).send({ ativo: false });

  it('um ano antes de uma data', () => {
    expect(umAnoAntes(new Date('2027-11-01T10:00:00.000Z'))).toBe('2026-11-01T10:00:00.000Z');
  });

  it('antes de passar um ano, nada muda', async () => {
    await desativar('joao');
    expect(anonimizarContasExpiradas(bd, daquiA(364))).toBe(0);
    expect(bd.prepare('SELECT nome FROM utilizador WHERE id = ?').get(id('joao'))?.nome).toBe('João Pires');
  });

  it('EC-56: ao fim de um ano, a conta passa a "Conta removida" e mantém projetos, atribuições e comentários', async () => {
    const joao = id('joao');
    const marta = id('marta');
    await desativar('joao');
    await desativar('marta'); // autora dos comentários de "Enviar proposta ao fornecedor"
    expect(anonimizarContasExpiradas(bd, daquiA(366))).toBe(3); // João, Marta e Rui (desativado no seed)

    const linha = bd.prepare('SELECT nome, email, anonimizado_em FROM utilizador WHERE id = ?').get(joao);
    expect(linha).toMatchObject({ nome: 'Conta removida', email: `removida-${joao}@matriz.invalid` });
    expect(linha?.anonimizado_em).not.toBeNull();
    expect((await entrar(`removida-${joao}@matriz.invalid`, PALAVRA_PASSE)).status).toBe(401);
    expect((await entrar(EMAILS.joao)).status).toBe(401);

    const ana = await como('ana');
    const membros = (await ana.get(`/api/projetos/${SITE()}/membros`)).body;
    expect(membros).toContainEqual({ id: joao, nome: 'Conta removida', contaAtiva: false });
    const tarefas = (await ana.get(`/api/projetos/${SITE()}/tarefas`)).body;
    const fotografias = tarefas.find((t: { titulo: string }) => t.titulo === 'Escolher fotografias');
    expect(fotografias.responsaveis).toEqual([{ id: joao, nome: 'Conta removida', contaAtiva: false }]);
    const proposta = tarefas.find((t: { titulo: string }) => t.titulo === 'Enviar proposta ao fornecedor');
    const comentarios = (await ana.get(`/api/projetos/${SITE()}/tarefas/${proposta.id}/comentarios`)).body;
    expect(comentarios[0].autor).toEqual({ id: marta, nome: 'Conta removida', contaAtiva: false });
  });

  it('RV-34: a conta anonimizada fica no fim da lista, marcada como removida, e não pode ser alterada', async () => {
    const rui = id('rui'); // antes da anonimização, que apaga o email
    const joao = id('joao');
    await desativar('joao');
    anonimizarContasExpiradas(bd, daquiA(366));
    const helena = await como('helena');
    const lista = (await helena.get('/api/utilizadores')).body;
    expect(lista.at(-1)).toMatchObject({ nome: 'Conta removida', removida: true, perfis: [] });
    const removidas = lista.filter((c: { removida: boolean }) => c.removida).map((c: { id: number }) => c.id);
    expect(removidas.sort((a: number, b: number) => a - b)).toEqual([rui, joao].sort((a, b) => a - b));
    const resposta = await helena.patch(`/api/utilizadores/${rui}`).send({ ativo: true });
    expect(resposta.status).toBe(422);
    expect(resposta.body.codigo).toBe('CONTA_REMOVIDA');
  });

  it('RV-34: reativar antes de um ano cancela a anonimização; numa nova desativação, o prazo recomeça', async () => {
    const helena = await como('helena');
    await desativar('joao');
    await helena.patch(`/api/utilizadores/${id('joao')}`).send({ ativo: true });
    expect(anonimizarContasExpiradas(bd, daquiA(366))).toBe(1); // só o Rui
    expect(bd.prepare('SELECT nome FROM utilizador WHERE id = ?').get(id('joao'))?.nome).toBe('João Pires');

    // Nova desativação: conta a partir desta data, não da primeira.
    bd.prepare('UPDATE utilizador SET ativo = 0, desativado_em = ? WHERE id = ?').run(daquiA(200).toISOString(), id('joao'));
    expect(anonimizarContasExpiradas(bd, daquiA(366))).toBe(0);
    expect(anonimizarContasExpiradas(bd, daquiA(566))).toBe(1);
  });

  it('a anonimização apaga os perfis e as sessões', async () => {
    const helena = await como('helena');
    await helena.put(`/api/admin/projetos/${CRM()}/gestor`).send({ gestorId: id('ana') });
    await helena.patch(`/api/utilizadores/${id('paulo')}`).send({ ativo: false });
    anonimizarContasExpiradas(bd, daquiA(366));
    expect(Number(bd.prepare('SELECT COUNT(*) AS n FROM perfil_atribuido WHERE utilizador_id = ?').get(id('paulo'))?.n)).toBe(0);
    expect(Number(bd.prepare('SELECT COUNT(*) AS n FROM sessao WHERE utilizador_id = ?').get(id('paulo'))?.n)).toBe(0);
  });
});

// ---------------------------------------------------------------- Segunda revisão de segurança (RV-36 a RV-40)

describe('RV-36, EC-58: retirar o perfil Gestor a quem está em vários projetos ativos', () => {
  async function gestorEmDoisProjetos() {
    const helena = await como('helena');
    const sofia = (await helena.post('/api/utilizadores').send(conta({ perfis: ['GESTOR'] }))).body;
    expect((await helena.post(`/api/admin/projetos/${SITE()}/membros`).send({ utilizadorId: sofia.id })).status).toBe(201);
    expect((await helena.post(`/api/admin/projetos/${CRM()}/membros`).send({ utilizadorId: sofia.id })).status).toBe(201);
    return { helena, sofia };
  }
  const perfisDe = (utilizadorId: number) =>
    bd.prepare('SELECT perfil FROM perfil_atribuido WHERE utilizador_id = ?').all(utilizadorId).map((l) => l.perfil);

  it('é recusado com 422 e os perfis ficam iguais', async () => {
    const { helena, sofia } = await gestorEmDoisProjetos();
    const resposta = await helena.patch(`/api/utilizadores/${sofia.id}`).send({ perfis: [] });
    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ codigo: 'GESTOR_EM_VARIOS_PROJETOS', campo: 'perfis' });
    expect(perfisDe(sofia.id)).toEqual(['GESTOR']);
  });

  it('depois de sair de um dos projetos, o perfil Gestor pode ser retirado', async () => {
    const { helena, sofia } = await gestorEmDoisProjetos();
    expect((await helena.delete(`/api/admin/projetos/${CRM()}/membros/${sofia.id}`)).status).toBe(204);
    expect((await helena.patch(`/api/utilizadores/${sofia.id}`).send({ perfis: [] })).status).toBe(200);
    expect(perfisDe(sofia.id)).toEqual([]);
  });

  it('os projetos arquivados não contam (RV-31)', async () => {
    const helena = await como('helena');
    const sofia = (await helena.post('/api/utilizadores').send(conta({ perfis: ['GESTOR'] }))).body;
    await helena.post(`/api/admin/projetos/${SITE()}/membros`).send({ utilizadorId: sofia.id });
    bd.prepare('INSERT INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)').run(RELATORIO(), sofia.id);
    expect((await helena.patch(`/api/utilizadores/${sofia.id}`).send({ perfis: [] })).status).toBe(200);
  });
});

describe('RV-40: o domínio .invalid fica reservado às contas anonimizadas', () => {
  it('criar uma conta com um email .invalid é recusado com 422, também em maiúsculas', async () => {
    const helena = await como('helena');
    for (const email of [`removida-${id('rui')}@matriz.invalid`, 'alguem@MATRIZ.INVALID']) {
      const resposta = await helena.post('/api/utilizadores').send(conta({ email }));
      expect(resposta.status).toBe(422);
      expect(resposta.body).toMatchObject({ codigo: 'EMAIL_RESERVADO', campo: 'email' });
    }
  });

  it('P33: uma conta que não se consegue anonimizar não impede as outras', async () => {
    const helena = await como('helena');
    const sofia = (await helena.post('/api/utilizadores').send(conta())).body;
    await helena.patch(`/api/utilizadores/${sofia.id}`).send({ ativo: false });
    // Conta anterior a RV-40, com o email que a anonimização do Rui usaria.
    bd.prepare("INSERT INTO utilizador (nome, email, palavra_passe_hash) VALUES ('Antiga', ?, 'x')").run(
      `removida-${id('rui')}@matriz.invalid`,
    );
    const erros = vi.spyOn(console, 'error').mockImplementation(() => {});
    const n = anonimizarContasExpiradas(bd, new Date(Date.now() + 2 * 365 * DIA_MS));
    expect(n).toBe(1);
    expect(erros).toHaveBeenCalledTimes(1);
    expect(String(erros.mock.calls[0]?.[0])).toContain(`conta ${id('rui')}`);
    erros.mockRestore();
    const removida = (pessoaId: number) =>
      bd.prepare('SELECT anonimizado_em FROM utilizador WHERE id = ?').get(pessoaId)?.anonimizado_em !== null;
    expect(removida(sofia.id)).toBe(true);
    expect(removida(id('rui'))).toBe(false);
  });
});

describe('RV-38: palavra-passe com no máximo 72 bytes', () => {
  it('72 bytes são aceites; 73 são recusados com 422 e o limite', async () => {
    const helena = await como('helena');
    expect((await helena.post('/api/utilizadores').send(conta({ palavraPasse: 'ç'.repeat(36) }))).status).toBe(201);
    const resposta = await helena
      .post('/api/utilizadores')
      .send(conta({ email: 'outra@matriz.test', palavraPasse: 'ç'.repeat(36) + 'a' }));
    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ codigo: 'PALAVRA_PASSE_LONGA', campo: 'palavraPasse', limite: 72 });
  });
});

describe('RV-39: email em minúsculas, incluindo as letras acentuadas', () => {
  it('guarda-se em minúsculas, recusa a versão em maiúsculas e entra com qualquer uma', async () => {
    const helena = await como('helena');
    const criada = await helena.post('/api/utilizadores').send(conta({ email: 'Élia.Sá@Matriz.test' }));
    expect(criada.status).toBe(201);
    expect(criada.body.email).toBe('élia.sá@matriz.test');
    const repetida = await helena.post('/api/utilizadores').send(conta({ email: 'ÉLIA.SÁ@matriz.test' }));
    expect(repetida.body.codigo).toBe('EMAIL_REPETIDO');
    expect((await entrar('ÉLIA.SÁ@MATRIZ.TEST', 'inicial-1234')).status).toBe(200);
  });
});

describe('RV-37, CA-02.2: primeira conta e seed de demonstração', () => {
  const dados = { nome: 'Dona do Produto', email: 'Dona@Empresa.test', palavraPasse: 'inicial-1234' };
  const contarContas = (base: Bd) => Number(base.prepare('SELECT COUNT(*) AS n FROM utilizador').get()?.n);

  it('numa base sem contas, cria a primeira conta com o perfil Administrador, que consegue entrar', async () => {
    const vazia = abrirBd(':memory:');
    aplicarMigrations(vazia);
    const criada = criarPrimeiraConta(vazia, dados);
    expect(criada).toMatchObject({ email: 'dona@empresa.test', perfis: ['ADMIN'], ativo: true });
    const resposta = await request(criarApp({ bd: vazia }))
      .post('/api/sessao')
      .send({ email: dados.email, palavraPasse: dados.palavraPasse });
    expect(resposta.status).toBe(200);
    expect(Number(vazia.prepare('SELECT COUNT(*) AS n FROM projeto').get()?.n)).toBe(0);
    vazia.close();
  });

  it('numa base com contas, é recusada e não cria nada', () => {
    const antes = contarContas(bd);
    expect(() => criarPrimeiraConta(bd, dados)).toThrow(ErroHttp);
    expect(() => criarPrimeiraConta(bd, dados)).toThrow(/já tem contas/);
    expect(contarContas(bd)).toBe(antes);
  });

  it('aplica as regras das contas (P3)', () => {
    const vazia = abrirBd(':memory:');
    aplicarMigrations(vazia);
    expect(() => criarPrimeiraConta(vazia, { ...dados, palavraPasse: 'curta' })).toThrow(/pelo menos 8/);
    expect(contarContas(vazia)).toBe(0);
    vazia.close();
  });

  it('o seed só corre em desenvolvimento e nunca com a palavra-passe de exemplo', () => {
    const exemplo = 'valor-de-exemplo-1';
    const motivo = (desenvolvimento: boolean, palavraPasse: string) =>
      motivoParaRecusarSeed({ desenvolvimento, palavraPasse, palavraPasseDeExemplo: exemplo });
    expect(motivo(false, 'outra-1234')).toMatch(/NODE_ENV=development/);
    expect(motivo(true, exemplo)).toMatch(/valor de exemplo/);
    expect(motivo(true, 'outra-1234')).toBeNull();
  });
});
