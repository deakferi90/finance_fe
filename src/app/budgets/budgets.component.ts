import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren,
  OnChanges,
  Input,
} from '@angular/core';
import { BudgetsService } from './budgets.service';
import { Budget } from './budgets.interface';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Transaction } from '../transactions/transaction.interface';
import { DonutChartComponent } from './donut-chart/donut-chart.component';
import { HttpClientModule } from '@angular/common/http';
import { ModalComponent } from './modal/modal.component';
import { Chart } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { PotsSharedService } from '../shared/pots-shared.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CommonModule,
    DonutChartComponent,
    MatProgressBarModule,
    HttpClientModule,
    ModalComponent,
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss',
})
export class BudgetsComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChildren('menuContainer') menuContainers:
    | QueryList<ElementRef>
    | never[] = [];
  @ViewChild(DonutChartComponent) donutChart!: DonutChartComponent;
  @Input() showBudgets!: boolean;
  @Input() showAddButton: boolean = true;
  @Input() showBudgetsList!: boolean;
  @Input() showBudgetsOnOverview!: boolean;
  chart!: Chart;
  dotsUrl: string = 'assets/dots.png';
  progress: number = 50;
  totalAmount: number = 0;
  spent: number[] = [];
  spentValues: number[] = [];
  openDropDownIndex: number | null = null;
  progressBarHeight: string = '24px';
  transactions: Transaction[] = [];
  budgets: Budget[] | any = [];
  filteredBudgets: Budget[] = [];
  budgetData!: Budget;
  displaySpent: any;
  showAll = false;
  isModalVisible = false;
  modalTitle: string = '';
  modalContent: string = '';
  colorBudget: string = '';
  selectedCategory: string | null = null;
  deleteMsg: string = '';
  cancel: string = '';
  selectedTheme: string = '';
  selectedBudget: Budget | null = null;
  updatedObject!: object;

  get spentArray(): number[] {
    return Array.isArray(this.spent) ? this.spent : [this.spent];
  }

  budgetColors: { [key: string]: string } = {
    Entertainment: '#277C78',
    Bills: '#82C9D7',
    'Dining Out': '#F2CDAC',
    'Personal Care': '#626070',
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private budgetService: BudgetsService,
    private potsSharedService: PotsSharedService,
  ) {}

  ngOnInit(): void {
    this.loadBudgetData();
  }

  ngAfterViewInit() {
    setTimeout(() => this.callCreateChart(), 0);
  }

  themeChanged(newTheme: string) {
    if (this.selectedBudget) {
      this.selectedBudget = { ...this.selectedBudget, theme: newTheme };
    }
  }

  addBudget() {
    this.modalTitle = 'Add New Budget';
    this.modalContent = `Choose category to set a spending budget. These categories can help you monitor spending.`;
    this.isModalVisible = true;
    this.onAddBudget(this.budgets);
  }

  openEditModal(budget: Budget) {
    this.modalTitle = 'Edit Budget';
    this.modalContent = `As your budgets change, feel free to update your spending limits.`;
    this.isModalVisible = true;
    this.budgetData = budget;
  }

  openDeleteModal(budget: Budget) {
    this.modalTitle = `Delete '${budget.category}'`;
    this.modalContent = `Are you sure you want to delete this budget?`;
    this.deleteMsg = 'Yes, Confirm Deletion';
    this.cancel = 'No, Go Back';

    this.budgetData = budget;
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
  }

  getAbsoluteSpent(budget: Budget): number {
    return Math.abs(this.calculateTotalSpent(budget));
  }

  toggleMenu(index: number) {
    if (this.openDropDownIndex === index) {
      this.openDropDownIndex = null;
    } else {
      this.openDropDownIndex = index;
    }
  }

  ngOnChanges() {
    if (this.budgets.length) {
      this.donutChart.createChart();
    }
    this.loadBudgetData();
    console.log('on changes');
  }

  onBudgetAdded(newBudget: Budget) {
    this.filteredBudgets = [...this.budgets, newBudget];
    this.loadBudgetData();
    this.refreshChart();
  }

  calculateTotalSpent(budget: Budget): number {
    return this.transactions
      .filter((item) => item.category === budget.category)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  calculateRemainingAmount(budget: Budget): number {
    const spent = this.calculateTotalSpent(budget);
    return spent < 0 ? budget.amount - Math.abs(spent) : 0;
  }

  calculateSpentPercentage(budget: Budget): number {
    const spent = this.calculateTotalSpent(budget);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return Math.min(percentage, 100);
  }
  toggleShowAll(category: string | null) {
    this.selectedCategory =
      this.selectedCategory === category ? null : category;
  }

  budgetSelected(updatedBudget: Budget) {
    this.filteredBudgets = this.filteredBudgets.map((budget) =>
      budget.id === updatedBudget.id ? { ...budget, ...updatedBudget } : budget,
    );
  }

  getVisibleTransactions(category: string): Transaction[] {
    const filteredTransactions = this.transactions.filter(
      (item) => item.category === category,
    );
    return this.selectedCategory === category
      ? filteredTransactions
      : filteredTransactions.slice(0, 3);
  }

  handleValue(value: number[]) {
    this.spentValues = value;
  }

  animateBudgetBars() {
    this.filteredBudgets.forEach((budget) => {
      const targetValue = (this.getAbsoluteSpent(budget) / budget.amount) * 100;
      budget.animatedValue = budget.animatedValue ?? 0;

      const step = () => {
        budget.animatedValue! += 2;
        if (budget.animatedValue! < targetValue) {
          requestAnimationFrame(step);
        } else {
          budget.animatedValue = targetValue;
        }
      };

      requestAnimationFrame(step);
    });
  }

  loadBudgetData() {
    this.budgetService.getBudgetData().subscribe((data) => {
      if (Array.isArray(data.budgets) && data.budgets.length > 0) {
        this.budgets = data.budgets;
        this.transactions = data.transactions;

        this.filteredBudgets = this.budgets.filter(
          (budget: Budget) => !budget.optional,
        );

        this.recalculateSpentValues();
        this.cdr.detectChanges();
        this.animateBudgetBars();
      } else {
        console.error('Unexpected data format', data);
      }
    });
    this.potsSharedService.sendBudgets(this.filteredBudgets);
  }

  onEditBudget(budgetId: number | string, updatedData: Partial<Budget>) {
    const budgetIdNumber = Number(budgetId);

    this.budgetService.updateBudget(budgetIdNumber, updatedData).subscribe(
      (response) => {
        this.budgets = this.budgets.map((budget: { id: any }) =>
          budget.id === response.id ? { ...budget, ...response } : budget,
        );

        this.filteredBudgets = this.budgets.filter(
          (budget: { optional: any }) => !budget.optional,
        );

        this.budgets = [
          ...new Set(this.budgets.map((budget: { id: any }) => budget.id)),
        ].map((id) =>
          this.budgets.find((budget: { id: unknown }) => budget.id === id),
        );

        this.recalculateSpentValues();
        this.refreshChart();
        this.animateBudgetBars();

        this.isModalVisible = false;

        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error updating budget:', error);
      },
    );
  }

  updateBudgetColors() {
    this.budgetColors = {};

    this.budgets.forEach((budget: any) => {
      this.budgets[budget.category] = true;
    });
  }

  deleteBudget(budgetId: number) {
    this.budgetService.deleteBudget(budgetId).subscribe({
      next: () => {
        const deletedBudget = this.budgets.find(
          (b: { id: number }) => b.id === budgetId,
        );

        this.budgets = this.budgets.filter(
          (b: { id: number }) => b.id !== budgetId,
        );
        this.filteredBudgets = this.filteredBudgets.filter(
          (b) => b.id !== budgetId,
        );

        if (deletedBudget && this.budgetColors[deletedBudget.category]) {
          delete this.budgetColors[deletedBudget.category];
        }

        this.budgets.sort((a: Budget, b: Budget) => a.id - b.id);
        this.filteredBudgets = this.budgets.filter(
          (b: { optional: boolean }) => !b.optional,
        );

        this.recalculateSpentValues();
        this.refreshChart();

        this.isModalVisible = false;
        this.cdr.detectChanges();

        this.toastr.success('Budget deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting budget:', err);
        this.toastr.error('Failed to delete budget');
      },
    });
  }

  onAddBudget(budgetData: Budget) {
    this.budgetService.addBudget(budgetData).subscribe({
      next: (newBudget) => {
        if (!newBudget) {
          console.error('Failed to add budget');
          return;
        }

        this.filteredBudgets = this.budgets.filter((b: any) => !b.optional);

        this.recalculateSpentValues();
        this.refreshChart();

        this.isModalVisible = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error adding budget:', err),
    });
  }

  refreshChart() {
    if (this.donutChart) {
      this.donutChart.createChart();
    }
  }

  recalculateSpentValues() {
    this.spent = this.filteredBudgets.map((b) =>
      Math.abs(this.calculateTotalSpent(b)),
    );

    Promise.resolve().then(() => {
      this.spentValues = [...this.spent];
      this.cdr.detectChanges();
    });
  }

  callCreateChart() {
    if (this.donutChart) {
      this.donutChart.createChart();
    } else {
      console.warn('Retrying in 100ms...');
    }
  }

  getRemainingFormatted(budget: any): string {
    const value = this.calculateRemainingAmount(budget);
    return value < 0 ? '$0.00' : '$' + value.toFixed(2);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    let clickedInside = false;

    this.menuContainers.forEach((menu) => {
      if (menu.nativeElement.contains(event.target)) {
        clickedInside = true;
      }
    });

    if (!clickedInside && this.openDropDownIndex !== null) {
      this.openDropDownIndex = null;
    }
  }
}
