import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-location-input',
  imports: [FormsModule],
  template: `
    <div class="location-input">
      <label>Latitude: <input [(ngModel)]="lat" type="number" step="0.0001"></label>
      <label>Longitude: <input [(ngModel)]="lon" type="number" step="0.0001"></label>
      <button (click)="submit()">Get Forecast</button>
    </div>
  `,
  styles: [`.location-input { display:flex; gap:8px; align-items:center }`]
})
export class LocationInputComponent {
  lat = 39.7456;
  lon = -97.0892;
  @Output() location = new EventEmitter<{ lat: number; lon: number }>();

  submit() {
    this.location.emit({ lat: Number(this.lat), lon: Number(this.lon) });
  }
}
