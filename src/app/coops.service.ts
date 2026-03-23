import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CoopsObservation {
  station: string;
  waterLevelM?: number;
  waterLevelFt?: number;
  waterTempC?: number;
  waterTempF?: number;
  timeISO?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class CoopsService {
  private readonly base = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

  constructor(private http: HttpClient) {}

  private extractCoopsId(nameOrId: string): string | null {
    // Some activestations have names like "9414290 - San Francisco, CA" where
    // the leading digits are the CO-OPS station ID. Try to extract that.
    const m = String(nameOrId).trim().match(/^(\d{5,7})/);
    return m ? m[1] : null;
  }

  /** Fetch latest water level (and water temp if available) for a station id or name. */
  getLatestObservation(stationIdOrName: string): Observable<CoopsObservation | null> {
    const sid = this.extractCoopsId(stationIdOrName) || stationIdOrName;
    if (!sid) return of(null);

    const params = (product: string) =>
      `${this.base}?station=${encodeURIComponent(sid)}&product=${product}&units=metric&time_zone=GMT&format=json`;

    const water$ = this.http.get(params('water_level'), { responseType: 'json' as 'json' }).pipe(catchError(() => of(null)));
    const temp$ = this.http.get(params('water_temperature'), { responseType: 'json' as 'json' }).pipe(catchError(() => of(null)));

    return forkJoin([water$, temp$]).pipe(
      map(([w, t]) => {
        const obs: CoopsObservation = { station: sid };
        try {
          if (w && Array.isArray((w as any).data) && (w as any).data.length) {
            const last = (w as any).data[(w as any).data.length - 1];
            const v = Number(last.v);
            if (!isNaN(v)) {
              obs.waterLevelM = Math.round(v * 100) / 100;
              obs.waterLevelFt = Math.round(v * 3.28084 * 100) / 100;
            }
            if (last.t) {
              // last.t is like "2026-03-23 12:56"
              const dt = new Date(last.t + 'Z');
              if (!isNaN(dt.getTime())) obs.timeISO = dt.toISOString();
            }
          }
        } catch (e) {
          // ignore parsing errors
        }

        try {
          if (t && Array.isArray((t as any).data) && (t as any).data.length) {
            const lastt = (t as any).data[(t as any).data.length - 1];
            const tv = Number(lastt.v);
            if (!isNaN(tv)) {
              obs.waterTempC = Math.round(tv * 10) / 10;
              obs.waterTempF = Math.round(((tv * 9) / 5 + 32) * 10) / 10;
            }
          }
        } catch (e) {
          // ignore
        }

        // if nothing found return null
        if (!obs.waterLevelM && !obs.waterTempC) return null;
        return obs;
      }),
      catchError(() => of(null))
    );
  }
}
