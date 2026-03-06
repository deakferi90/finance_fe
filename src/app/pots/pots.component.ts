import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { PotsService } from './pots.service';
import { Pots } from './pots.interface';
import { PotsmodalComponent } from './potsmodal/potsmodal.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { PotsSharedService } from '../shared/pots-shared.service';

@Component({
  selector: 'app-pots',
  standalone: true,
  imports: [PotsmodalComponent, MatProgressBarModule, CommonModule],
  templateUrl: './pots.component.html',
  styleUrls: ['./pots.component.scss'],
})
export class PotsComponent implements OnInit {
  @ViewChildren('menuContainer') menuContainers:
    | QueryList<ElementRef>
    | never[] = [];
  @ViewChild(PotsmodalComponent) potsModal!: PotsmodalComponent;
  progressBarHeight: string = '12px';
  dotsUrl: string = 'assets/dots.png';
  openDropDownIndex: number | null = null;
  modalTitle: string = '';
  modalContent: string = '';
  isModalVisible: boolean = false;
  selectedPot!: Pots;
  selectedPotId: number | null = null;
  selectedPotName: string = '';
  pots: (Pots & { animatedWidth?: string })[] = [];
  modalMode: 'edit' | 'delete' | 'add' = 'delete';
  @Input() showAddButton: boolean = true;
  @Input() showPotsBox: boolean = true;
  @Input() displayPots: Pots[] = [];
  @Input() totalSaved: any = 0;

  constructor(
    private potsService: PotsService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private potsSharedService: PotsSharedService,
  ) {}

  ngOnInit(): void {
    this.getPotsData();
  }

  addPot() {
    this.modalMode = 'add';
    this.modalTitle = 'Add New Pot';
    this.modalContent = `Create a pot to set savings targets. These can help keep you on track as you save for special purchases.`;
    this.isModalVisible = true;
  }

  onAddNewPot(pot: Pots) {
    this.potsService.addPot(pot).subscribe((newPot) => {
      this.pots.push(newPot);
      this.getPotsData();
      this.toastr.success('Pot added successfully!');
      this.isModalVisible = false;
    });
  }

  calculateBufferValue(pot: any): number {
    return Math.min(((pot.current + (pot.buffer || 0)) / pot.total) * 100, 100);
  }

  calculatePercentageWidth(pot: Pots): string {
    const percentage = (pot.total / pot.target) * 100;
    return percentage.toFixed(2) + '%';
  }

  getPotsData() {
    this.potsService.getPots().subscribe((data: any[]) => {
      this.pots = data.map((p) => ({
        ...p,
        id: p._id,
        animatedValue: 0,
      }));

      this.pots.forEach((pot) => {
        const targetValue = this.calculatePercentageValue(pot);
        this.animateProgress(pot, targetValue);
      });
      this.totalSaved = this.pots.reduce((sum, pot) => sum + pot.total, 0);
      this.potsSharedService.sendTotalSaved(this.totalSaved);
      this.potsSharedService.sendTotalPots(this.pots);
    });
  }

  calculatePercentageValue(pot: Pots): number {
    if (!pot?.target || pot.target === 0) return 0;
    return Math.min((pot.total / pot.target) * 100, 100);
  }

  private animateProgress(pot: Pots, target: number) {
    let current = 0;

    const step = () => {
      current += 10;
      pot.animatedValue = Math.min(current, target);

      this.cdr.detectChanges();

      if (current < target) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  addMoney() {
    console.log('moeny is being added');
  }

  withDrawMoney() {
    console.log('money is withdrawing');
  }

  toggleMenu(index: number) {
    if (this.openDropDownIndex === index) {
      this.openDropDownIndex = null;
    } else {
      this.openDropDownIndex = index;
    }
  }

  closeModal() {
    this.isModalVisible = false;
  }

  // onEditPot(updatedPot: Pots) {
  //   if (!updatedPot._id) {
  //     console.error('Error: Pot ID is missing');
  //     return;
  //   }

  //   this.potsService.updatePot(String(updatedPot._id), updatedPot).subscribe({
  //     next: () => {
  //       this.toastr.success('Pot updated successfully!');
  //       this.closeModal();
  //     },
  //     error: (err) => {
  //       console.error('Error updating pot:', err);
  //       this.toastr.error('Failed to update pot');
  //     },
  //   });
  // }

  onEditPot(updatedPot: Pots) {
    if (!updatedPot._id) return;

    this.potsService.updatePot(String(updatedPot._id), updatedPot).subscribe({
      next: (response) => {
        this.pots = this.pots.map((pot) =>
          pot._id === response._id ? { ...pot, ...response } : pot,
        );

        const target = this.calculatePercentageValue(
          this.pots.find((p) => p._id === response._id)!,
        );
        this.animateProgress(
          this.pots.find((p) => p._id === response._id)!,
          target,
        );

        this.toastr.success('Pot updated successfully!');
        this.closeModal();
      },
      error: (err) => {
        console.error('Error updating pot:', err);
        this.toastr.error('Failed to update pot');
      },
    });
  }

  openEditPotModal(pot: Pots) {
    this.selectedPot = pot;
    this.selectedPotName = pot.name;
    this.isModalVisible = true;
    this.modalMode = 'edit';
  }

  openDeletePotModal(pot: any) {
    this.selectedPotId = pot._id;
    this.selectedPotName = pot.name;
    this.modalMode = 'delete';
    this.isModalVisible = true;
  }

  confirmDeletePot() {
    if (!this.selectedPotId) return;

    this.potsService.deletePot(this.selectedPotId).subscribe({
      next: () => {
        const index = this.pots.findIndex((p) => p.id === this.selectedPotId);
        if (index !== -1) this.pots.splice(index, 1);

        this.toastr.success('Pot deleted successfully!');
        this.isModalVisible = false;
        this.selectedPotId = null;

        this.potsModal.allPots = this.pots;
        this.potsModal.updateThemeUsage();
      },
      error: (err) => {
        console.error('Error deleting pot:', err);
        this.toastr.error('Failed to delete pot');
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    let clickedInside = false;

    this.menuContainers.forEach(
      (menu: {
        nativeElement: { contains: (arg0: EventTarget | null) => any };
      }) => {
        if (menu.nativeElement.contains(event.target)) {
          clickedInside = true;
        }
      },
    );

    if (!clickedInside && this.openDropDownIndex !== null) {
      this.openDropDownIndex = null;
    }
  }
}
