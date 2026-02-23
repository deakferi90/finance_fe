import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Budget } from '../budgets.interface';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ModalService } from './modal.service';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs';
import { DonutChartComponent } from '../donut-chart/donut-chart.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() content!: string;
  @Input() deleteMsg!: string;
  @Input() cancel!: string;
  @Input() budgets: Budget[] | any = [];
  @Input() title = '';
  @Input() message = '';
  @Input() budgetColors: { [key: string]: string } = {};
  @Input() selectedBudget!: any;
  @Input() loadDataBudget!: () => void;
  @Input() recalculateSpentValues!: () => void;
  @Input() loadBudgetData!: () => void;
  @ViewChild(DonutChartComponent) donutChart!: DonutChartComponent;
  @Output() closeModal = new EventEmitter<void>();
  @Output() themeChanged = new EventEmitter<Budget>();
  @Output() budgetSelected = new EventEmitter<Budget>();
  @Output() budgetUpdated = new EventEmitter<Budget>();
  @Output() budgetAdded = new EventEmitter<Budget>();
  @Output() chartRedraw = new EventEmitter<void>();
  @Output() budgetDeleted = new EventEmitter<number>();
  maxSpeed: number = 0;
  initialBudgets: Budget[] = [];
  allCategories: Budget[] = [];

  colorMapping: { [key: string]: string } = {
    '#277C78': 'Green',
    '#82C9D7': 'Cyan',
    '#426CD5': 'Blue',
    '#F2CDAC': 'Desert Sand',
    '#FFA500b3': 'Orange',
    '#626070': 'Gray',
    '#FFB6C1CC': 'Pink',
  };

  dropdownStates: { [key: string]: boolean } = {
    category: false,
    amount: false,
    theme: false,
  };

  selectedCategory: any = null;
  previousSelections: any[] = [];
  selectedAmount: number | string | null | undefined = null;
  selectedTheme: string | undefined = '';
  newValue: Budget | object = {};
  filteredBudgets!: Budget[];
  selectedColorName: string = '';
  dropdownDisabled: boolean = true;

  constructor(
    private modalService: ModalService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.modalService
      .getBudgets()
      .pipe(take(1))
      .subscribe((budgets: Budget[]) => {
        this.filteredBudgets = budgets;

        this.budgetColors = {};
        budgets.forEach((b) => {
          if (!b.optional) {
            this.budgetColors[b.category] = b.theme;
          }
        });
      });
    this.allCategories = [
      {
        id: 1,
        category: 'Entertainment',
        amount: 50.0,
        theme: '#277C78',
        color: 'Green',
        optional: false,
      },
      {
        id: 2,
        category: 'Bills',
        amount: 750.0,
        theme: '#82C9D7',
        color: 'Cyan',
        optional: false,
      },
      {
        id: 3,
        category: 'Groceries',
        amount: 110.0,
        theme: '#426CD5',
        color: 'Blue',
        optional: true,
      },
      {
        id: 4,
        category: 'Dining Out',
        amount: 75.0,
        theme: '#F2CDAC',
        color: 'Desert Sand',
        optional: false,
      },
      {
        id: 5,
        category: 'Transportation',
        amount: 110.0,
        theme: '#FFA500b3',
        color: 'Orange',
        optional: true,
      },
      {
        id: 6,
        category: 'Personal Care',
        amount: 100.0,
        theme: '#626070',
        color: 'Gray',
        optional: false,
      },
      {
        id: 7,
        category: 'Education',
        amount: 50.0,
        theme: '#FFB6C1CC',
        color: 'Pink',
        optional: true,
      },
    ];
  }

  allCategoriesWithStatus() {
    return this.allCategories.map((cat) => {
      const isUsed = this.budgets.some(
        (b: { category: string; optional: any }) =>
          b.category === cat.category && !b.optional,
      );
      return { ...cat, alreadyUsed: isUsed };
    });
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  toggleDropdown(dropdown: string) {
    this.dropdownStates[dropdown] = !this.dropdownStates[dropdown];

    Object.keys(this.dropdownStates).forEach((key) => {
      if (key !== dropdown) {
        this.dropdownStates[key] = false;
      }
    });
  }

  getColorName(): string {
    return this.selectedColorName || '';
  }

  selectOption(dropdown: string, option: any) {
    if (dropdown === 'category') {
      this.selectedCategory = option;

      const selectedCategoryOption = this.allCategories.find(
        (cat) => cat.category === option.category,
      );

      if (selectedCategoryOption) {
        this.selectedTheme = selectedCategoryOption.theme;
        this.selectedAmount = selectedCategoryOption.amount;
        this.selectedColorName = selectedCategoryOption.color;
      }
    } else if (dropdown === 'theme') {
      this.selectedTheme = option.theme;
      this.selectedColorName = option.color;
    }

    this.dropdownStates[dropdown] = false;
  }

  formatNumber(event: any) {
    let value = parseFloat(event.target.value);

    if (!isNaN(value)) {
      this.maxSpeed = parseFloat(value.toFixed(2));
    } else {
      this.maxSpeed = 0;
    }
  }

  updateBudget() {
    const maxSpeedInput = document.querySelector(
      '.max-speed',
    ) as HTMLInputElement;
    const inputValue = maxSpeedInput?.value;

    const updatedBudget: Budget = {
      id: this.selectedBudget.id,
      amount: inputValue ? Number(inputValue) : this.selectedBudget.amount,
      category: this.selectedCategory?.category || this.selectedBudget.category,
      theme: this.selectedTheme || this.selectedBudget.theme,
      color:
        this.selectedTheme && this.colorMapping[this.selectedTheme]
          ? this.colorMapping[this.selectedTheme]
          : this.selectedBudget.color,
    };

    this.modalService.updateBudget(updatedBudget).subscribe(
      (response: Budget) => {
        this.budgetUpdated.emit(response);
        this.toastr.success('Budget updated successfully!');

        this.selectedBudget = { ...this.selectedBudget, ...response };

        this.budgets = this.budgets.map((budget: { id: number }) =>
          budget.id === response.id ? { ...budget, ...response } : budget,
        );

        this.modalService
          .getBudgets()
          .pipe(take(1))
          .subscribe((budgets: Budget[]) => {
            this.filteredBudgets = budgets;
            this.initialBudgets = [...budgets];
          });

        this.resetSelections();

        this.close();
      },
      (error) => {
        this.toastr.error('Error updating budget');
        console.error('Update failed:', error);
      },
    );
  }

  close() {
    this.selectedCategory =
      this.initialBudgets.find(
        (budget) => budget.category === this.selectedCategory?.category,
      ) || null;

    this.selectedTheme = this.selectedCategory
      ? this.selectedCategory.theme
      : '';

    this.selectedAmount = this.selectedCategory
      ? this.selectedCategory.amount
      : null;

    this.selectedBudget = null;
    this.closeModal.emit();
  }

  refreshChart() {
    if (this.donutChart) {
      this.donutChart.createChart();
    }
  }

  addBudget() {
    const selAmountInput = document.querySelector(
      '.max-speed',
    ) as HTMLInputElement | null;

    if (!this.selectedCategory) {
      this.toastr.warning('Please select a category');
      return;
    }

    const amountValue = selAmountInput?.value
      ? Number(selAmountInput.value)
      : 0;

    const newBudget: Budget = {
      id: this.selectedCategory.id,
      category: this.selectedCategory.category,
      amount: amountValue,
      theme: this.selectedCategory.theme,
      color: this.selectedCategory.color,
      optional: false,
    };

    this.modalService.addBudget(newBudget).subscribe({
      next: (response: Budget | null) => {
        if (!response) return;

        const existingIndex = this.budgets.findIndex(
          (b: { id: number }) => b.id === response.id,
        );
        if (existingIndex > -1) {
          this.budgets[existingIndex] = response;
        } else {
          this.budgets.push(response);
        }

        this.filteredBudgets = this.budgets.filter(
          (b: { optional: boolean }) => !b.optional,
        );

        this.budgetColors[response.category] = response.theme;

        this.budgetAdded.emit(response);

        this.resetSelections();
        this.close();

        if (this.donutChart) {
          this.donutChart.createChart();
        }

        this.toastr.success('Budget added successfully!');
      },
      error: (err) => {
        console.error('Error adding budget:', err);
        this.toastr.error('Failed to add budget');
      },
    });
  }

  confirmDelete() {
    if (this.selectedBudget) {
      const deletedId = this.selectedBudget.id;

      this.budgets = this.budgets.filter(
        (b: { id: number }) => b.id !== deletedId,
      );
      this.filteredBudgets = this.filteredBudgets.filter(
        (b) => b.id !== deletedId,
      );

      if (this.budgetColors[this.selectedBudget.category]) {
        delete this.budgetColors[this.selectedBudget.category];
      }

      this.budgetDeleted.emit(deletedId);

      this.closeModal.emit();
    }
  }

  cancelDelete() {
    this.closeModal.emit();
  }

  resetSelections() {
    this.selectedCategory = null;
    this.selectedAmount = null;
    this.selectedTheme = '';
  }
}
