// emolumentos.models.ts
export type TipoAto = 'compra_e_venda' | 'doacao' | 'sem_valor' | 'procuracao' | 'partilha' | 'cessao_direitos';

export interface CalculoRequest {
  tipo: TipoAto;
  valores: string[];
  usufruto?: boolean;
  partes_adicionais?: number;
}

// Representa a estrutura de moeda devolvida pela API
export interface ValorMonetario {
  raw: string;
  brl: string;
}

// Representa cada imóvel individualmente retornado na array "itens"
export interface ItemCalculado {
  descricao: string;
  valor_base?: ValorMonetario;
  emolumentos?: ValorMonetario;
  funrejus?: ValorMonetario;
  selo?: ValorMonetario;
  distribuidor?: ValorMonetario;
  folha?: ValorMonetario;
  fundep?: ValorMonetario;
  issqn?: ValorMonetario;
  vrc?: ValorNumerico;
  total?: ValorMonetario;
}

// Representa a consolidação das taxas retornada no "total_geral"
export interface TotalGeral {
  valor_base?: ValorMonetario;
  emolumentos?: ValorMonetario;
  funrejus?: ValorMonetario;
  selo?: ValorMonetario;
  distribuidor?: ValorMonetario;
  folha?: ValorMonetario;
  fundep?: ValorMonetario;
  issqn?: ValorMonetario;
  vrc?: ValorMonetario;
  total?: ValorMonetario;
}

export interface CalculoResponse {
  tipo: string;
  itens: ItemCalculado[];
  total_geral: TotalGeral;
}

export interface ValorNumerico {
  raw: string;
  fmt: string;
}
