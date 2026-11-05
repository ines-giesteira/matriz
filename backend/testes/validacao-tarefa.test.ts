// Testes unitários da validação do título da tarefa (RF-09, Q-01, A-20; TP-01 de docs/test-plan.md).
// Chamam validarDados diretamente, sem API nem base de dados (Ficha 4, Exercício 2).
import { describe, expect, it } from 'vitest';
import { ErroHttp } from '../src/http/erros.js';
import type { DadosTarefa } from '../src/modulos/tarefas/repositorio.js';
import { LIMITE_TITULO, validarDados } from '../src/modulos/tarefas/servico.js';

const comTitulo = (titulo: string): DadosTarefa => ({ titulo, descricao: null, prioridade: 'MEDIUM', dataLimite: null });

/** Corre a validação e devolve o erro lançado, ou undefined se os dados forem aceites. */
function erroDe(dados: DadosTarefa): ErroHttp | undefined {
  try {
    validarDados(dados);
    return undefined;
  } catch (erro) {
    if (erro instanceof ErroHttp) return erro;
    throw erro;
  }
}

describe('validação do título da tarefa (RF-09)', () => {
  it('RF-09: um título preenchido é aceite', () => {
    expect(erroDe(comTitulo('Preparar reunião de arranque'))).toBeUndefined();
  });

  it('EC-01: um título vazio é recusado com 422 TITULO_OBRIGATORIO', () => {
    const erro = erroDe(comTitulo(''));
    expect(erro).toMatchObject({ estado: 422, codigo: 'TITULO_OBRIGATORIO', campo: 'titulo' });
  });

  it('EC-02: um título só com espaços conta como vazio (Q-01)', () => {
    const erro = erroDe(comTitulo('   '));
    expect(erro).toMatchObject({ estado: 422, codigo: 'TITULO_OBRIGATORIO', campo: 'titulo' });
  });

  it('EC-29: o valor-limite de 200 caracteres é aceite (A-20)', () => {
    expect(LIMITE_TITULO).toBe(200);
    expect(erroDe(comTitulo('a'.repeat(200)))).toBeUndefined();
  });

  it('EC-29: 201 caracteres são recusados com 422 LIMITE_EXCEDIDO e o limite indicado', () => {
    const erro = erroDe(comTitulo('a'.repeat(201)));
    expect(erro).toMatchObject({ estado: 422, codigo: 'LIMITE_EXCEDIDO', campo: 'titulo', limite: 200 });
  });
});
