import { Component, signal, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
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
  loadingForecast = false;
  loadingCurrent = false;
  forecastError: string | null = null;
  currentError: string | null = null;

  constructor(private weather: WeatherService) {}

  ngOnInit(): void {
    // Optionally fetch default ZIP current conditions on startup
    const zip = environment.defaultZip;
    if (zip) this.onZip(zip);
  }

  onLocation(e: { lat: number; lon: number }) {
    this.periods = null;
    this.forecastError = null;
    this.loadingForecast = true;
    this.weather.getForecastByLatLon(e.lat, e.lon).subscribe({
      next: p => {
        this.periods = p;
        this.loadingForecast = false;
      },
      error: err => {
        this.forecastError = String(err || 'Failed to load forecast');
        this.loadingForecast = false;
      }
    });
  }

  onZip(zip: string) {
    this.currentConditions = null;
    this.currentError = null;
    this.loadingCurrent = true;
    this.weather.getCurrentObservationByZip(zip).subscribe({
      next: obs => {
        this.currentConditions = obs ? obs.properties ?? obs : null;
        this.loadingCurrent = false;
      },
      error: err => {
        this.currentError = String(err || 'Failed to load current conditions');
        this.loadingCurrent = false;
      }
    });
  }
}
