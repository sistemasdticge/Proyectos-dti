import { Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-anios',
  imports: [],
  templateUrl: './anios.html',
  styleUrl: './anios.css',
})
export class Anios {
  items = input<string[]>([]);
  selected = input<string | null>(null);
  selectedItems = input<string[]>([]);
  multiSelect = input(false);

  selectedChange = output<string>();
  selectedItemsChange = output<string[]>();

  isSelected(item: string): boolean {
    if (this.multiSelect()) {
      return this.selectedItems().includes(item);
    }

    return this.selected() === item;
  }

  onSelect(item: string): void {
    if (this.multiSelect()) {
      const current = this.selectedItems();

      if (current.includes(item) && current.length === 1) {
        return;
      }

      const next = current.includes(item)
        ? current.filter((year) => year !== item)
        : [...current, item];

      this.selectedItemsChange.emit(next);
      this.selectedChange.emit(item);
      return;
    }

    this.selectedItemsChange.emit([item]);
    this.selectedChange.emit(item);
  }
}
