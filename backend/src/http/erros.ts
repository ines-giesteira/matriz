// Erros da API no formato `Erro` do openapi.yaml. Os serviços lançam ErroHttp e o tratador de app.ts responde.
import type { ZodType } from 'zod';

export class ErroHttp extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensagem: string,
    public readonly campo?: string,
    public readonly limite?: number,
  ) {
    super(mensagem);
  }

  corpo(): { codigo: string; mensagem: string; campo?: string; limite?: number } {
    return {
      codigo: this.codigo,
      mensagem: this.message,
      ...(this.campo !== undefined && { campo: this.campo }),
      ...(this.limite !== undefined && { limite: this.limite }),
    };
  }
}

export const naoEncontrado = () => new ErroHttp(404, 'NAO_ENCONTRADO', 'Não encontrado.');
export const semPermissao = () => new ErroHttp(403, 'SEM_PERMISSAO', 'Não tem permissão para esta ação.');
export const pedidoInvalido = () => new ErroHttp(400, 'PEDIDO_INVALIDO', 'O pedido tem um formato inválido.');

/** Valida o formato do pedido (400): tipos, campos desconhecidos e enumerados. As regras de negócio dão 422. */
export function validarFormato<T>(esquema: ZodType<T>, dados: unknown): T {
  const resultado = esquema.safeParse(dados);
  if (!resultado.success) throw pedidoInvalido();
  return resultado.data;
}

/** Identificador numérico de um caminho; um valor que não é inteiro positivo não corresponde a nenhum recurso (404). */
export function idDoCaminho(valor: string | undefined): number {
  if (!valor || !/^[1-9]\d{0,15}$/.test(valor)) throw naoEncontrado();
  return Number(valor);
}
