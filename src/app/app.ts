import { Component, signal, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { WeatherService } from './weather.service';
import { ForecastComponent } from './forecast/forecast.component';
import { ZipInputComponent } from './zip-input/zip-input.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ForecastComponent, ZipInputComponent],
  templateUrl: './app.simple.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('shorepound weather');
  periods: any[] | null = null;
  currentConditions: any | null = null;
  loadingForecast = false;
  loadingCurrent = false;
  forecastError: string | null = null;
  currentError: string | null = null;

  constructor(private weather: WeatherService) {}

  ngOnInit(): void {
    const zip = environment.defaultZip;
    if (zip) this.onZip(zip);
  }

  private applyThemeFromObservation(obs: any | null) {
    const body = document.body;
    const themes = ['theme-clear', 'theme-cloudy', 'theme-rain', 'theme-snow', 'theme-fog', 'theme-cold', 'theme-warm', 'theme-default'];
    // remove old theme classes
    themes.forEach(t => body.classList.remove(t));

    if (!obs) {
      body.classList.add('theme-default');
      return;
    }

    const desc = (obs.textDescription || obs.summary || '').toLowerCase();
    const temp = obs.temperature && typeof obs.temperature.value === 'number' ? obs.temperature.value : null;

    if (/snow|sleet|blizzard/.test(desc)) body.classList.add('theme-snow');
    else if (/rain|shower|drizzle|storm|thunder/.test(desc)) body.classList.add('theme-rain');
    else if (/fog|mist|haze/.test(desc)) body.classList.add('theme-fog');
    else if (/cloud|overcast/.test(desc)) body.classList.add('theme-cloudy');
    else if (/clear|sunny/.test(desc)) body.classList.add('theme-clear');
    else if (temp !== null) {
      // temp is in Celsius from API; convert to Fahrenheit for simple thresholds
      const f = temp * 9 / 5 + 32;
      if (f <= 32) body.classList.add('theme-cold');
      else if (f <= 68) body.classList.add('theme-warm');
      else body.classList.add('theme-clear');
    } else {
      body.classList.add('theme-default');
    }
  }

  degToCardinal(deg: number | null): string {
    if (deg == null || isNaN(deg)) return '';
    const directions = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const idx = Math.round(((deg % 360) / 360) * 16) % 16;
    return directions[idx];
  }

  formatTemperature(t: any): string {
    if (!t) return '';
    const val = typeof t === 'number' ? t : t.value ?? null;
    let unit = t.unitCode ?? t.unit ?? '';
    if (typeof unit === 'string' && unit.includes(':')) unit = unit.split(':').pop() || unit;
    if (val == null) return '';
    // assume value in Celsius if unit mentions degC, otherwise handle degF
    const isC = typeof unit === 'string' ? /degC/i.test(unit) : true;
    if (isC) {
      const c = val;
      const f = Math.round((c * 9) / 5 + 32 * 10) / 10; // intent: compute f to one decimal
      const fVal = Math.round(((c * 9) / 5 + 32) * 10) / 10;
      const cVal = Math.round(c * 10) / 10;
      return `${cVal}°C / ${fVal}°F`;
    } else {
      const f = val;
      const cVal = Math.round(((f - 32) * 5) / 9 * 10) / 10;
      const fVal = Math.round(f * 10) / 10;
      return `${cVal}°C / ${fVal}°F`;
    }
  }

  formatWind(w: any, dir: any = null): string {
    if (!w) return '';
    // If wind is a string, return it with optional direction
    if (typeof w === 'string') {
      const d = dir && (dir.value ?? dir) ? this.degToCardinal(Number(dir.value ?? dir)) : '';
      return d ? `${w} ${d}` : w;
    }

    const val = w.value ?? w.speed ?? null;
    let unit = w.unitCode ?? w.unit ?? '';
    if (typeof unit === 'string' && unit.includes(':')) unit = unit.split(':').pop() || unit;

    // If unit is meters per second, also show mph
    let primary = '';
    let extra = '';
    if (val != null && typeof val === 'number') {
      const rounded = Math.round(val * 10) / 10;
      primary = `${rounded} ${unit}`.trim();
      if (/m_s-1|m\/s|m_s/.test(String(unit))) {
        const mph = Math.round((val * 2.23693629) * 10) / 10;
        extra = `${mph} mph`;
      } else if (/km_h-1|km\/h/.test(String(unit))) {
        const mph = Math.round((val * 0.621371) * 10) / 10;
        extra = `${mph} mph`;
      }
    } else if (val != null) {
      primary = String(val);
    }

    const dDeg = dir && (dir.value ?? dir) ? Number(dir.value ?? dir) : null;
    const dCard = this.degToCardinal(dDeg);
    return [primary, extra, dCard].filter(Boolean).join(' ');
  }

  formatHumidity(h: any): string {
    if (!h) return '';
    const val = typeof h === 'number' ? h : h.value ?? null;
    if (val == null) return '';
    // if value seems fractional (0-1), convert to percentage
    let pct = Number(val);
    if (pct > 0 && pct <= 1) pct = pct * 100;
    const rounded = Math.round(pct * 10) / 10;
    return `${rounded}%`;
  }

  onZip(zip: string) {
    this.currentConditions = null;
    this.currentError = null;
    this.loadingCurrent = true;
    this.periods = null;
    this.loadingForecast = true;

    // load current observation
    this.weather.getCurrentObservationByZip(zip).subscribe({
      next: obs => {
        this.currentConditions = obs ? obs.properties ?? obs : null;
        this.loadingCurrent = false;
        this.applyThemeFromObservation(this.currentConditions);
      },
      error: err => {
        this.currentError = String(err || 'Failed to load current conditions');
        this.loadingCurrent = false;
        this.applyThemeFromObservation(null);
      }
    });

    // load forecast
    this.weather.getForecastByZip(zip).subscribe({
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
}
