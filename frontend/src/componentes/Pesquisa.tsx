// Campo de pesquisa pelo nome (RF-33). Avisa quem o usa depois de uma breve pausa na escrita.
import { useEffect, useState } from 'react';

type Props = { rotulo: string; aoPesquisar: (texto: string) => void };

export function Pesquisa({ rotulo, aoPesquisar }: Props) {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    const temporizador = setTimeout(() => aoPesquisar(texto), 250);
    return () => clearTimeout(temporizador);
  }, [texto, aoPesquisar]);

  return (
    <div className="pesquisa" role="search">
      <label htmlFor="pesquisa-nome">{rotulo}</label>
      <input id="pesquisa-nome" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} />
    </div>
  );
}
