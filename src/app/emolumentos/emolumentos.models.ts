export type TipoAto = 'compra_e_venda' | 'doacao' | 'sem_valor' | 'procuracao';

export interface CalculoRequest {
  tipo: TipoAto;
  valores: string[];          // ["30000", "20000"] — sempre string
  usufruto?: boolean;         // só é relevante na doacao
  partes_adicionais?: number; // só é relevante na procuracao
}

export interface Componente {
  nome: string;               // "Emolumentos", "Funrejus", ...
  valor: string;              // "1377.24" — Decimal exato como string
  valor_brl: string;          // "R$ 1.377,24" — já formatado
}

export interface CalculoResponse {
  tipo: string;
  componentes: Componente[];
  total: string;               // "1377.24" — Decimal exato como string
  total_brl: string;           // "R$ 1.377,24" — já formatado
}
