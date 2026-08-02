import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable(); // Aguarda a estabilização do componente
    const compiled = fixture.nativeElement as HTMLElement;

    // Atualizado para o novo título do design
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Saiba exatamente o que você paga na escritura.',
    );
  });
});
