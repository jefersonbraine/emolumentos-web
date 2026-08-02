import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmolumentosService } from '../emolumentos.service';
import { CalculoRequest, CalculoResponse, TipoAto } from '../../emolumentos/emolumentos.models';

export interface CalculoItemUI {
  id: string;
  desc: string;
  baseStr: string;
}

@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calculadora.html',
})
export class Calculadora {
  private service = inject(EmolumentosService);

  // --- SINAIS DE ENTRADA ---
  tipo = signal<TipoAto>('compra_e_venda');
  itens = signal<CalculoItemUI[]>([{ id: this.generateId(), desc: 'Imóvel 1', baseStr: '' }]);
  usufruto = signal<boolean>(false);
  partesAdicionais = signal<number>(0);

  // --- SINAIS DE ESTADO ---
  resultado = signal<CalculoResponse | null>(null);
  erro = signal<string | null>(null);
  carregando = signal(false);

  // --- CONTROLE DINÂMICO ---
  mostraValores = computed(() => ['compra_e_venda', 'doacao'].includes(this.tipo()));
  mostraUsufruto = computed(() => this.tipo() === 'doacao');
  mostraPartes = computed(() => this.tipo() === 'procuracao');

  // --- MANIPULAÇÃO DA UI ---
  adicionarItem() {
    this.itens.update((itensAtual) => [
      ...itensAtual,
      { id: this.generateId(), desc: `Imóvel ${itensAtual.length + 1}`, baseStr: '' },
    ]);
  }

  removerItem(id: string) {
    this.itens.update((itensAtual) =>
      itensAtual.length > 1 ? itensAtual.filter((i) => i.id !== id) : itensAtual,
    );
  }

  // NOVO: Intercepta a digitação e aplica a máscara em tempo real
  onValorChange(item: CalculoItemUI, novoValor: string) {
    item.baseStr = this.mascaraMoeda(novoValor);
  }

  // NOVO: Lógica de pontuação automática
  private mascaraMoeda(valor: string): string {
    if (!valor) return '';
    // Remove tudo que não for dígito
    const apenasNumeros = valor.replace(/\D/g, '');
    if (!apenasNumeros) return '';

    // Divide por 100 para criar os centavos matematicamente
    const valorDecimal = parseInt(apenasNumeros, 10) / 100;

    // Devolve formatado como moeda brasileira
    return valorDecimal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // --- INTEGRAÇÃO COM A API ---
  calcular() {
    this.erro.set(null);

    this.carregando.set(true);

    // ATUALIZADO: Remove os pontos de milhar e troca vírgula por ponto para a API
    const valoresProcessados: string[] = this.mostraValores()
      ? this.itens()
          .map((i) => i.baseStr.replace(/\./g, '').replace(',', '.'))
          .filter((v) => v !== '' && Number(v) > 0)
      : [];

    const request: CalculoRequest = {
      tipo: this.tipo(),
      valores: valoresProcessados,
    };

    if (this.mostraUsufruto()) request.usufruto = this.usufruto();
    if (this.mostraPartes()) request.partes_adicionais = this.partesAdicionais();

    this.service.calcular(request).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(`Erro ${err.status}: ${JSON.stringify(err.error)}`);
        this.carregando.set(false);
      },
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // --- MÉTODOS AUXILIARES PARA O HTML ---

  getBaseTotal(): string {
    const res = this.resultado();
    if (res?.total_geral?.valor_base?.brl) {
      return res.total_geral.valor_base.brl;
    }
    const total = this.itens().reduce((acc, item) => {
      // ATUALIZADO: Parse seguro para pontos de milhar
      const num = parseFloat(item.baseStr.replace(/\./g, '').replace(',', '.')) || 0;
      return acc + num;
    }, 0);
    return total > 0 ? `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '0,00';
  }

  // Busca o valor no objeto 'total_geral' da API e formata para a tabela horizontal
  getValorApi(nomeColuna: string): string {
    const res = this.resultado();
    if (!res || !res.total_geral) return '0,00';

    const mapaChaves: Record<string, string> = {
      Emolumentos: 'emolumentos',
      Funrejus: 'funrejus',
      Selo: 'selo',
      Distribuidor: 'distribuidor',
      Folha: 'folha',
      FUNDEP: 'fundep',
      ISSQN: 'issqn',
      VRC: 'vrc',
    };

    const chave = mapaChaves[nomeColuna];
    const totais = res.total_geral as any;

    if (chave && totais[chave]?.brl) {
      return totais[chave].brl.replace('R$ ', '').trim();
    }
    return '0,00';
  }

  getTotalFinal(): string {
    return this.resultado()?.total_geral?.total?.brl || 'R$ 0,00';
  }

  // Aproveita a array 'itens' da API para preencher a linha decomposta de cada imóvel
  estimativaLocal(item: CalculoItemUI) {
    // Extrai o valor numérico digitado pelo usuário
    const baseNum = parseFloat(item.baseStr.replace(/\./g, '').replace(',', '.')) || 0;
    const active = baseNum > 0;

    // Verifica se o item atual é o primeiro da lista de imóveis
    const isPrimeiro = this.itens().length > 0 && this.itens()[0].id === item.id;

    // Taxas fixas: aplicadas apenas se houver valor E for o primeiro imóvel
    const selo = active && isPrimeiro ? 8.0 : 0;
    const distrib = active && isPrimeiro ? 12.45 : 0;
    const folha = active ? 0.0 : 0;

    const formata = (n: number) =>
      n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const res = this.resultado();

    if (res && res.itens) {
      // Cruza o item da UI com a resposta da API através da Descrição
      const apiItem = res.itens.find((i) => i.descricao === item.desc);

      if (apiItem) {
        const limpa = (v: any) => (v?.brl ? v.brl.replace('R$ ', '').trim() : '0,00');

        // Somamos o total retornado pela API com as nossas taxas locais para fechar a conta da linha
        const apiTotalNum = parseFloat(apiItem.total?.raw || '0');
        const totalRow = apiTotalNum + selo + distrib + folha;

        return {
          emol: limpa(apiItem.emolumentos),
          funrejus: limpa(apiItem.funrejus),
          selo: formata(selo),
          distrib: formata(distrib),
          folha: formata(folha),
          fundep: limpa(apiItem.fundep),
          issqn: limpa(apiItem.issqn),
          vrc: '0,000',
          total: formata(totalRow),
        };
      }
    }

    // Fallback: Retorna as taxas fixas locais mesmo antes do cálculo oficial da API
    return {
      emol: '0,00',
      funrejus: '0,00',
      selo: formata(selo),
      distrib: formata(distrib),
      folha: formata(folha),
      fundep: '0,00',
      issqn: '0,00',
      vrc: '0,000',
      total: formata(selo + distrib + folha),
    };
  }

  getStatusLabel(): string {
    if (this.carregando()) return 'Calculando...';
    if (this.erro()) return 'API Indisponível';
    if (this.resultado()) return 'Valores oficiais · API';
    return 'Aguardando valores';
  }

  getStatusColor(): { text: string; dot: string } {
    if (this.carregando()) return { text: '#9a7b1f', dot: '#d9a814' };
    if (this.erro()) return { text: '#9a5a1f', dot: '#d98a14' };
    if (this.resultado()) return { text: '#1b7a52', dot: '#1b8a5b' };
    return { text: '#8a8478', dot: '#c9c3b8' };
  }
}

