// Cliente HTTP único da interface. O endereço base da API está só aqui (Ficha 3, Exercício 7).
// Em desenvolvimento, o Vite encaminha /api para o backend (vite.config.ts).
export const BASE_API = '/api';

/** Erro devolvido pela API, no formato `Erro` do openapi.yaml. */
export class ErroApi extends Error {
  constructor(
    public readonly estadoHttp: number,
    public readonly codigo: string,
    mensagem: string,
    public readonly campo?: string,
  ) {
    super(mensagem);
  }
}

export async function pedido<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_API}${caminho}`, {
      credentials: 'same-origin',
      ...opcoes,
      headers: { 'Content-Type': 'application/json', ...opcoes.headers },
    });
  } catch {
    throw new ErroApi(0, 'SEM_LIGACAO', 'Não foi possível contactar o servidor.');
  }

  if (resposta.status === 204) return undefined as T;

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      corpo?.codigo ?? 'ERRO',
      corpo?.mensagem ?? 'Ocorreu um erro inesperado. Tente novamente.',
      corpo?.campo,
    );
  }
  return corpo as T;
}
