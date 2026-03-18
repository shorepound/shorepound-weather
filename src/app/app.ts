import { Component, signal } from '@angular/core';
import { WeatherService } from './weather.service';
import { ForecastComponent } from './forecast/forecast.component';
import { LocationInputComponent } from './location-input/location-input.component';
import { ZipInputComponent } from './zip-input/zip-input.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, FormsModule, LocationInputComponent, ForecastComponent, ZipInputComponent],
  templateUrl: './app.simple.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('spweather-app');
  periods: any[] | null = null;
  currentConditions: any | null = null;

  constructor(private weather: WeatherService) {}

  onLocation(e: { lat: number; lon: number }) {
    this.periods = null;
    this.weather.getForecastByLatLon(e.lat, e.lon).subscribe(p => (this.periods = p));
  }

  onZip(zip: string) {
    this.currentConditions = null;
    this.weather.getCurrentObservationByZip(zip).subscribe((obs) => {
      this.currentConditions = obs ? obs.properties ?? obs : null;
    });
  }
}
