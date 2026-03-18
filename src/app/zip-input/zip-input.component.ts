import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-zip-input',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <form (ngSubmit)="submit()" #zipForm="ngForm" class="zip-form">
      <label for="zip">ZIP</label>
      <input
        id="zip"
        name="zip"
        type="text"
        required
        minlength="5"
        maxlength="5"
        pattern="\\d{5}"
        [(ngModel)]="zip"
        #zipModel="ngModel"
        placeholder="Enter ZIP"
        autocomplete="postal-code"
      />
      <div *ngIf="zipModel.invalid && zipModel.touched" class="error">
          <small *ngIf="zipModel.errors?.['required']">ZIP is required.</small>
          <small *ngIf="zipModel.errors?.['pattern'] || zipModel.errors?.['minlength']">Enter a 5-digit ZIP.</small>
      </div>
      <button type="submit" [disabled]="zipForm.invalid">Search</button>
    </form>
  `,
  styles: [`
    .zip-form { display: flex; gap: 8px; align-items: center; }
    input { padding: 4px 8px; }
    input.ng-invalid.ng-touched { border-color: #e74c3c; }
    .error small { color: #e74c3c; display: block; }
  `]
})
export class ZipInputComponent {
  @Input() zip = '';
  @Output() zipSubmit = new EventEmitter<string>();

  submit() {
    const value = (this.zip || '').trim();
    if (/^\d{5}$/.test(value)) {
      this.zipSubmit.emit(value);
    }
  }
}
