import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-forecast',
  imports: [CommonModule],
  template: `
    <div *ngIf="periods?.length; else empty">
      <div class="period" *ngFor="let p of periods">
        <img *ngIf="p.icon" [src]="p.icon" alt="icon" />
        <div>
          <strong>{{p.name}}</strong>
          <div>{{p.temperature}}° {{p.temperatureUnit}}</div>
          <div>{{p.shortForecast}}</div>
        </div>
      </div>
    </div>
    <ng-template #empty>
      <div>No forecast available.</div>
    </ng-template>
  `,
  styles: [`.period{display:flex;gap:8px;align-items:center;margin:8px 0}`]
})
export class ForecastComponent {
  @Input() periods: any[] | null = null;
}

