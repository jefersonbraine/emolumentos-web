import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmolumentosService } from '../emolumentos.service';
import { CalculoRequest, CalculoResponse, TipoAto, ValorMonetario } from '../../emolumentos/emolumentos.models';

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
  styleUrl: './calculadora.css',
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
  starTipOpen = signal(false);

  // --- CONTROLE DINÂMICO ---
  mostraValores = computed(() => ['compra_e_venda', 'doacao', 'partilha', 'cessao_direitos'].includes(this.tipo()));
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

    const valoresProcessados: string[] = this.mostraValores()
      ? this.itens()
          .map((i) => i.baseStr.replace(/\./g, '').replace(',', '.'))
          .filter((v) => v !== '' && Number(v) > 0)
      : [];

    // "Inventário/Divórcio" é um rótulo de UX — por trás, a fórmula é
    // idêntica à compra e venda (a regra 100%/80% já é automática para
    // qualquer tipo com 2+ bens). Traduz antes de mandar pra API.
    const tipoParaApi = this.tipo() === 'partilha' || this.tipo() === 'cessao_direitos' ? 'compra_e_venda' : this.tipo();

    const request: CalculoRequest = {
      tipo: tipoParaApi as TipoAto,
      valores: valoresProcessados,
    };

    if (this.mostraUsufruto()) request.usufruto = this.usufruto();
    if (this.mostraPartes()) request.partes_adicionais = this.partesAdicionais();

    this.service.calcular(request).subscribe({
      next: (res) => {
        this.resultado.set(res);

        if (res.itens?.length && res.itens.length > 1) {
          const valorNumerico = (item: CalculoItemUI) =>
            parseFloat(item.baseStr.replace(/\./g, '').replace(',', '.')) || 0;

          this.itens.update((itensAtuais) =>
            [...itensAtuais].sort((a, b) => valorNumerico(b) - valorNumerico(a)),
          );
        }

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

    if (nomeColuna === 'VRC') {
      return totais.vrc?.fmt ?? '0,000';
    }

    if (chave && totais[chave]?.brl) {
      return totais[chave].brl.replace('R$ ', '').trim();
    }
    return '0,00';
  }

  getTotalFinal(): string {
    return this.resultado()?.total_geral?.total?.brl || 'R$ 0,00';
  }

  estimativaLocal(item: CalculoItemUI) {
    const limpa = (v?: ValorMonetario) => (v?.brl ? v.brl.replace('R$ ', '').trim() : '0,00');
    const res = this.resultado();

    const indice = this.itens().findIndex((i) => i.id === item.id);
    const apiItem = res?.itens?.[indice];

    if (!apiItem) {
      return {
        emol: '0,00',
        funrejus: '0,00',
        selo: '0,00',
        distrib: '0,00',
        folha: '0,00',
        fundep: '0,00',
        issqn: '0,00',
        vrc: '0,000',
        total: '0,00',
      };
    }

    return {
      emol: limpa(apiItem.emolumentos),
      funrejus: limpa(apiItem.funrejus),
      selo: limpa(apiItem.selo),
      distrib: limpa(apiItem.distribuidor),
      folha: limpa(apiItem.folha),
      fundep: limpa(apiItem.fundep),
      issqn: limpa(apiItem.issqn),
      vrc: apiItem.vrc?.fmt ?? '0,000',
      total: limpa(apiItem.total),
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

