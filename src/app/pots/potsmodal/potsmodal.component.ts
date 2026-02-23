import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pots } from '../pots.interface';

@Component({
  selector: 'app-potsmodal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './potsmodal.component.html',
  styleUrls: ['./potsmodal.component.scss'],
})
export class PotsmodalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() selectedPot!: Pots;
  @Input() selectedPotName: string = '';
  @Input() mode: 'edit' | 'delete' | 'add' = 'delete';
  @Input() allPots: Pots[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<void>();
  @Output() potUpdated = new EventEmitter<Pots>();
  @Output() addNewPot = new EventEmitter<Pots>();

  isThemeDropdownOpen = false;

  addPot: Pots = {
    name: '',
    target: 0,
    total: 0,
    theme: '',
    themeColor: undefined,
    id: 0,
    _id: '0',
  };

  editPot: Pots = {
    name: '',
    target: 0,
    total: 0,
    theme: '',
    themeColor: undefined,
    id: 0,
    _id: '0',
  };

  themes = [
    { name: 'Green', value: '#277C78' },
    { name: 'Cyan', value: '#82C9D7' },
    { name: 'Desert Sand', value: '#F2CDAC' },
    { name: 'Gray', value: '#626070' },
    { name: 'Purple', value: '#826CB0' },
    { name: 'Blue', value: 'blue' },
    { name: 'Orange', value: 'orange' },
    { name: 'Pink', value: '#FFC0CB' },
  ];

  colorMapping: { [key: string]: string } = {
    '#277C78': 'Green',
    '#82C9D7': 'Cyan',
    '#F2CDAC': 'Desert Sand',
    '#626070': 'Gray',
    '#826CB0': 'Purple',
    blue: 'Blue',
    orange: 'Orange',
    '#FFC0CB': 'Pink',
  };

  get usedThemes(): string[] {
    if (this.mode === 'edit' && this.editPot) {
      return this.allPots
        .filter((pot) => pot.id !== this.editPot.id)
        .map((pot) => pot.theme);
    }
    return this.allPots.map((pot) => pot.theme);
  }

  get availableThemes() {
    return this.themes.filter((t) => !this.usedThemes.includes(t.value));
  }

  get selectedThemeName(): string {
    const targetPot = this.mode === 'edit' ? this.editPot : this.addPot;
    return this.colorMapping[targetPot.theme] || 'Select Theme';
  }

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedPot'] && this.selectedPot) {
      this.editPot = { ...this.selectedPot };
    }
  }

  allThemesWithStatus() {
    return this.themes.map((theme) => {
      const isUsed = this.allPots.some(
        (pot) =>
          pot.theme === theme.value &&
          (!this.editPot || pot.id !== this.editPot.id),
      );
      return { ...theme, alreadyUsed: isUsed };
    });
  }

  toggleThemeDropdown() {
    this.isThemeDropdownOpen = !this.isThemeDropdownOpen;
  }

  updateThemeUsage() {
    this.themes = this.themes.map((theme) => {
      const isUsed = this.allPots.some(
        (pot) => pot.theme === theme.value && pot.id !== this.editPot.id,
      );
      return { ...theme, alreadyUsed: isUsed };
    });
  }

  selectTheme(theme: any) {
    const oldTheme =
      this.mode === 'edit' ? this.editPot.theme : this.addPot.theme;

    if (this.mode === 'edit') {
      this.editPot.theme = theme.value;
      this.editPot.themeColor = theme.value;

      const potIndex = this.allPots.findIndex((p) => p.id === this.editPot.id);
      if (potIndex > -1) {
        this.allPots[potIndex] = { ...this.editPot };
      }
    } else {
      this.addPot.theme = theme.value;
      this.addPot.themeColor = theme.value;
    }
    this.updateThemeUsage();

    this.isThemeDropdownOpen = false;
  }

  onAdd() {
    if (!this.addPot.theme) return;

    const newPot: Pots = {
      ...this.addPot,
      id: Date.now(),
      _id: Date.now().toString(),
      total: this.addPot.target / 2,
    };

    this.allPots.push(newPot);

    this.addNewPot.emit(newPot);
  }

  onSave() {
    const potIndex = this.allPots.findIndex((p) => p.id === this.editPot.id);
    if (potIndex > -1) {
      this.allPots[potIndex] = { ...this.editPot };
    }

    this.potUpdated.emit(this.editPot);
  }

  onDelete() {
    this.confirmDelete.emit();
  }

  close() {
    this.closeModal.emit();
  }
}
