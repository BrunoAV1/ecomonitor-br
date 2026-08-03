import type { Location } from '../types/weather';

interface SearchComboboxOptions {
  input: HTMLInputElement;
  list: HTMLElement;
  button: HTMLButtonElement;
  search: (query: string, signal: AbortSignal) => Promise<Location[]>;
  onSelect: (location: Location) => void;
  unavailableLocation?: () => Location | null;
}

export class SearchCombobox {
  private results: Location[] = [];
  private activeIndex = -1;
  private debounceTimer: number | null = null;
  private request: AbortController | null = null;
  private requestSequence = 0;

  constructor(private readonly options: SearchComboboxOptions) {
    const { input, list, button } = options;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
    list.setAttribute('role', 'listbox');
    input.addEventListener('input', () => this.schedule());
    input.addEventListener('keydown', (event) => this.onKeydown(event));
    button.addEventListener('click', () => void this.runSearch());
    document.addEventListener('pointerdown', (event) => {
      if (event.target instanceof Node && !input.parentElement?.contains(event.target))
        this.close();
    });
  }

  destroy(): void {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    this.request?.abort();
  }

  private schedule(): void {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    this.request?.abort();
    if (this.options.input.value.trim().length < 2) {
      this.close();
      return;
    }
    this.debounceTimer = window.setTimeout(() => void this.runSearch(), 320);
  }

  private async runSearch(): Promise<void> {
    const query = this.options.input.value.trim();
    if (query.length < 2) {
      this.renderMessage('Digite ao menos 2 caracteres.');
      return;
    }
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    const sequence = ++this.requestSequence;
    this.renderMessage('Buscando cidades…', true);
    try {
      const results = await this.options.search(query, request.signal);
      if (sequence !== this.requestSequence || request.signal.aborted) return;
      const unavailable = this.options.unavailableLocation?.();
      this.results = unavailable
        ? results.filter((location) => location.id !== unavailable.id)
        : results;
      this.activeIndex = this.results.length > 0 ? 0 : -1;
      if (this.results.length === 0) this.renderMessage('Nenhuma cidade encontrada.');
      else this.renderResults();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (sequence === this.requestSequence)
        this.renderMessage('Não foi possível buscar agora. Tente novamente.');
    }
  }

  private renderMessage(message: string, loading = false): void {
    this.results = [];
    this.activeIndex = -1;
    const item = document.createElement('li');
    item.className = 'search-message';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-disabled', 'true');
    if (loading) item.classList.add('is-loading');
    item.textContent = message;
    this.options.list.replaceChildren(item);
    this.open();
  }

  private renderResults(): void {
    const fragment = document.createDocumentFragment();
    this.results.forEach((location, index) => {
      const item = document.createElement('li');
      item.id = `${this.options.list.id}-option-${index}`;
      item.className = 'search-option';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(index === this.activeIndex));
      const name = document.createElement('span');
      name.className = 'search-option__name';
      name.textContent = location.name;
      const detail = document.createElement('span');
      detail.className = 'search-option__detail';
      detail.textContent = [location.admin1, location.country].filter(Boolean).join(' · ');
      item.append(name, detail);
      item.addEventListener('pointerdown', (event) => event.preventDefault());
      item.addEventListener('click', () => this.select(index));
      fragment.append(item);
    });
    this.options.list.replaceChildren(fragment);
    this.open();
    this.syncActiveOption();
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.results.length === 0) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex = (this.activeIndex + delta + this.results.length) % this.results.length;
      this.syncActiveOption();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.activeIndex >= 0) this.select(this.activeIndex);
      else void this.runSearch();
    }
  }

  private syncActiveOption(): void {
    const options = this.options.list.querySelectorAll<HTMLElement>('[role="option"]');
    options.forEach((option, index) =>
      option.setAttribute('aria-selected', String(index === this.activeIndex)),
    );
    const active = options[this.activeIndex];
    if (active) {
      this.options.input.setAttribute('aria-activedescendant', active.id);
      active.scrollIntoView({ block: 'nearest' });
    } else {
      this.options.input.removeAttribute('aria-activedescendant');
    }
  }

  private select(index: number): void {
    const location = this.results[index];
    if (!location) return;
    this.options.input.value = '';
    this.close();
    this.options.onSelect(location);
  }

  private open(): void {
    this.options.list.hidden = false;
    this.options.input.setAttribute('aria-expanded', 'true');
  }

  close(): void {
    this.options.list.hidden = true;
    this.options.list.replaceChildren();
    this.options.input.setAttribute('aria-expanded', 'false');
    this.options.input.removeAttribute('aria-activedescendant');
    this.results = [];
    this.activeIndex = -1;
  }
}
