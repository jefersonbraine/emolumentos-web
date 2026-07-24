import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmolumentosService } from '../emolumentos.service';
import { CalculoResponse, TipoAto } from '../../emolumentos/emolumentos.models';

@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calculadora.html',
})
export class Calculadora {
  private service = inject(EmolumentosService);

  tipo = signal<TipoAto>('compra_e_venda');
  valor = signal('50000');
  resultado = signal<CalculoResponse | null>(null);

  erro = signal<string | null>(null);
  carregando = signal(false);

  calcular() {
    this.erro.set(null);
    this.resultado.set(null);
    this.carregando.set(true);

    this.service.calcular({
      tipo: this.tipo(),
      valores: [this.valor()],
    }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(`Erro ${err.status}: ${JSON.stringify(err.error)}`);
        this.carregando.set(false);
      }
    })
  }
 }
