import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export interface NdbcStation {
  id: string;
  lat: number;
  lon: number;
  name: string;
  type: string;
  owner: string;
  distKm?: number;
}

export interface NdbcObservation {
  station: string;
  YY?: string | null;
  MM?: string | null;
  DD?: string | null;
  hh?: string | null;
  mm?: string | null;
  WDIR?: string | null;
  WSPD?: string | null;
  GST?: string | null;
  WVHT?: string | null;
  DPD?: string | null;
  APD?: string | null;
  MWD?: string | null;
  PRES?: string | null;
  ATMP?: string | null;
  WTMP?: string | null;
  DEWP?: string | null;
  VIS?: string | null;
  PTDY?: string | null;
  TIDE?: string | null;
  waveHeightM?: number;
  waveHeightFt?: number;
  waterTempF?: number;
  airTempF?: number;
  windMph?: number;
  gustMph?: number;
  pressureHpa?: number;
  visibilityNm?: number;
  dewpointC?: number;
  dewpointF?: number;
  timeISO?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class NdbcService {
  private readonly ndbcBase: string;
  private stationsCache$: Observable<NdbcStation[]> | null = null;
  private obsCache = new Map<string, Observable<NdbcObservation | null>>();

  constructor(private http: HttpClient) {
    // In production, use the site proxy; in dev, proxy via Angular dev-server proxy
    const base = environment.weatherApiBase || '';
    // weatherApiBase is e.g. '/api' or 'https://weather.shorepound.net/api'
    // NDBC proxy is at sibling path /ndbc
    this.ndbcBase = base.replace(/\/api\/?$/, '/ndbc');
  }

  /** Fetch all active NDBC stations (cached). */
  getActiveStations(): Observable<NdbcStation[]> {
    if (this.stationsCache$) return this.stationsCache$;

    this.stationsCache$ = this.http
      .get(`${this.ndbcBase}/activestations.xml`, { responseType: 'text' })
      .pipe(
        map(xml => this.parseStationsXml(xml)),
        catchError(() => of([])),
        shareReplay(1)
      );

    return this.stationsCache$;
  }

  /** Find the N nearest stations within maxDistanceKm of given lat/lon. */
  findNearestStations(lat: number, lon: number, count = 3, maxDistanceKm = 150): Observable<NdbcStation[]> {
    return this.getActiveStations().pipe(
      map(stations => {
        return stations
          .map(s => ({ ...s, distKm: this.haversine(lat, lon, s.lat, s.lon) }))
          .filter(s => s.distKm <= maxDistanceKm)
          .sort((a, b) => a.distKm - b.distKm)
          .slice(0, count);
      })
    );
  }

  /** Get latest observation for a station by fetching realtime2 text and parsing it. */
  getLatestObservation(stationId: string): Observable<NdbcObservation | null> {
    const key = `obs:${stationId}`;
    if (this.obsCache.has(key)) return this.obsCache.get(key)!;

    const obs$ = this.http
      .get(`${this.ndbcBase}/data/realtime2/${stationId}.txt`, { responseType: 'text' })
      .pipe(
        map(txt => this.parseRealtime2(txt, stationId)),
        catchError(() => of(null)),
        shareReplay(1)
      );

    this.obsCache.set(key, obs$);
    return obs$;
  }

  private parseRealtime2(raw: string, stationId: string): NdbcObservation | null {
    const lines = raw.trim().split('\n');
    if (!lines || lines.length < 2) return null;

    // Header lines start with '#'. Find the last header line (contains column names),
    // then take the first non-header data line.
    const headerLine = lines.find(l => l.trim().startsWith('#') && /YY|yr|MM/.test(l)) || lines[0];
    const header = headerLine.replace(/^#+\s*/, '').trim();
    const headers = header.split(/\s+/);

    const dataLines = lines.filter(l => !l.trim().startsWith('#') && l.trim().length > 0);
    if (!dataLines || dataLines.length === 0) return null;
    const dataLine = dataLines[0].trim();
    const values = dataLine.split(/\s+/);

    const obs: NdbcObservation = { station: stationId };
    for (let i = 0; i < headers.length && i < values.length; i++) {
      obs[headers[i]] = values[i] === 'MM' ? null : values[i];
    }

    // Normalize and compute additional fields
    // Timestamp: first five numeric columns are year, month, day, hour, minute
    const y = values[0] ? Number(values[0]) : NaN;
    const mo = values[1] ? Number(values[1]) : NaN;
    const d = values[2] ? Number(values[2]) : NaN;
    const hh = values[3] ? Number(values[3]) : NaN;
    const mm = values[4] ? Number(values[4]) : NaN;
    if (!isNaN(y) && !isNaN(mo) && !isNaN(d) && !isNaN(hh) && !isNaN(mm)) {
      // handle 2-digit year or full year
      const year = y < 100 ? 2000 + y : y;
      try {
        const dt = new Date(Date.UTC(year, mo - 1, d, hh, mm));
        obs.timeISO = dt.toISOString();
      } catch (e) {
        // ignore
      }
    }

    // Numeric conversions
    const num = (k: string) => {
      const v = obs[k];
      if (v == null) return null;
      const n = Number(String(v));
      return isNaN(n) ? null : n;
    };

    const wv = num('WVHT');
    if (wv != null) {
      obs.waveHeightM = Math.round(wv * 10) / 10;
      obs.waveHeightFt = Math.round(wv * 3.28084 * 10) / 10;
    }

    const wspd = num('WSPD');
    if (wspd != null) {
      obs.WSPD = String(wspd);
      obs.windMph = Math.round(wspd * 2.23693629 * 10) / 10;
    }
    const gst = num('GST');
    if (gst != null) {
      obs.GST = String(gst);
      obs.gustMph = Math.round(gst * 2.23693629 * 10) / 10;
    }

    const pres = num('PRES');
    if (pres != null) obs.pressureHpa = pres;

    const vis = num('VIS');
    if (vis != null) obs.visibilityNm = vis;

    const atmp = num('ATMP');
    if (atmp != null) {
      obs.ATMP = String(atmp);
      obs.airTempF = Math.round(((atmp * 9) / 5 + 32) * 10) / 10;
    }
    const wtmp = num('WTMP');
    if (wtmp != null) {
      obs.WTMP = String(wtmp);
      obs.waterTempF = Math.round(((wtmp * 9) / 5 + 32) * 10) / 10;
    }
    const dewp = num('DEWP');
    if (dewp != null) {
      obs.DEWP = String(dewp);
      obs.dewpointC = dewp;
      obs.dewpointF = Math.round(((dewp * 9) / 5 + 32) * 10) / 10;
    }

    return obs;
  }

  private parseStationsXml(xml: string): NdbcStation[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const elements = doc.querySelectorAll('station');
    const stations: NdbcStation[] = [];

    elements.forEach(el => {
      const id = el.getAttribute('id') || '';
      const lat = parseFloat(el.getAttribute('lat') || '0');
      const lon = parseFloat(el.getAttribute('lon') || '0');
      const name = el.getAttribute('name') || '';
      const type = el.getAttribute('type') || '';
      const owner = el.getAttribute('owner') || '';
      if (id && !isNaN(lat) && !isNaN(lon)) {
        stations.push({ id, lat, lon, name, type, owner });
      }
    });

    return stations;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
