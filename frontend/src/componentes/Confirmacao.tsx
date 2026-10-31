// Pedido de confirmação antes de uma ação definitiva, como eliminar (A-10, EC-10).
import { useEffect, useRef } from 'react';

type Props = {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  aConfirmar?: boolean;
  erro?: string | null;
  aoConfirmar: () => void;
  aoCancelar: () => void;
};

export function Confirmacao({ titulo, mensagem, textoConfirmar, aConfirmar = false, erro, aoConfirmar, aoCancelar }: Props) {
  const cancelar = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelar.current?.focus(), []);

  return (
    <div className="fundo-dialogo" onKeyDown={(e) => e.key === 'Escape' && !aConfirmar && aoCancelar()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="titulo-confirmacao" className="dialogo">
        <h2 id="titulo-confirmacao">{titulo}</h2>
        <p>{mensagem}</p>
        {erro && (
          <p role="alert" className="erro">
            {erro}
          </p>
        )}
        <div className="acoes">
          <button type="button" className="botao-secundario" ref={cancelar} onClick={aoCancelar} disabled={aConfirmar}>
            Cancelar
          </button>
          <button type="button" className="botao-perigo" onClick={aoConfirmar} disabled={aConfirmar}>
            {aConfirmar ? 'A eliminar…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
