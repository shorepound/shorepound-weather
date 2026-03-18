import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError, shareReplay } from 'rxjs/operators';

interface PointsResponse {
  properties: { forecast: string; observationStations?: string };
}

interface ForecastResponse {
  properties: { periods: any[] };
}

interface StationsFeatureCollection {
  features: Array<{ id?: string; properties?: { stationIdentifier?: string } }>;
}

interface ZipResponse {
  'post code': string;
  country: string;
  places: Array<{ 'place name': string; state: string; latitude: string; longitude: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly base = environment.weatherApiBase || 'https://api.weather.gov';
  private cache = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  private headers(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        Accept: 'application/geo+json'
      })
    };
  }

  /**
   * Get forecast by latitude/longitude (cached).
   */
  getForecastByLatLon(lat: number, lon: number): Observable<any[]> {
    const key = `forecast:${lat},${lon}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const obs = this.http
      .get<PointsResponse>(`${this.base}/points/${lat},${lon}`, this.headers())
      .pipe(
        map(res => res.properties.forecast),
        switchMap(forecastUrl => this.http.get<ForecastResponse>(forecastUrl, this.headers())),
        map(f => f.properties.periods),
        catchError(() => of([])),
        shareReplay(1)
      );

    this.cache.set(key, obs);
    return obs;
  }

  /**
   * Lookup latitude/longitude and place name by US ZIP code using Zippopotam.us
   */
  getLatLonByZip(zip: string): Observable<{ lat: number; lon: number; place: string } | null> {
    const key = `zip:${zip}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const obs = this.http.get<ZipResponse>(`https://api.zippopotam.us/us/${zip}`).pipe(
      map(res => {
        const place = res.places && res.places[0];
        if (!place) return null;
        return {
          lat: parseFloat(place.latitude),
          lon: parseFloat(place.longitude),
          place: `${place['place name']}, ${place.state}`
        };
      }),
      catchError(() => of(null)),
      shareReplay(1)
    );

    this.cache.set(key, obs);
    return obs;
  }

  /**
   * Convenience: get forecast by ZIP code.
   */
  getForecastByZip(zip: string): Observable<any[]> {
    const key = `forecast:zip:${zip}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const obs = this.getLatLonByZip(zip).pipe(
      switchMap(loc => (loc ? this.getForecastByLatLon(loc.lat, loc.lon) : of([]))),
      catchError(() => of([])),
      shareReplay(1)
    );

    this.cache.set(key, obs);
    return obs;
  }

  /**
   * Get the latest/current observation for the closest station to the given lat/lon.
   * Returns the observation object or null on failure.
   */
  getCurrentObservationByLatLon(lat: number, lon: number): Observable<any | null> {
    const key = `obs:${lat},${lon}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const obs = this.http
      .get<PointsResponse>(`${this.base}/points/${lat},${lon}`, this.headers())
      .pipe(
        map(res => res.properties.observationStations),
        switchMap(stationsUrl => {
          if (!stationsUrl) return of(null);
          return this.http.get<StationsFeatureCollection>(stationsUrl, this.headers());
        }),
        switchMap(stationsRes => {
          if (!stationsRes || !stationsRes.features || !stationsRes.features.length) return of(null);
          const first = stationsRes.features[0];
          const stationIdFromProps = first.properties && first.properties.stationIdentifier;
          const stationId = first.id || stationIdFromProps;
          if (!stationId) return of(null);
          const stationUrl = stationId.startsWith('http') ? stationId : `${this.base}/stations/${stationId}`;
          return this.http.get<any>(`${stationUrl}/observations/latest`, this.headers());
        }),
        catchError(() => of(null)),
        shareReplay(1)
      );

    this.cache.set(key, obs);
    return obs;
  }

  /**
   * Convenience: get current observation by ZIP code.
   */
  getCurrentObservationByZip(zip: string): Observable<any | null> {
    const key = `obs:zip:${zip}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const obs = this.getLatLonByZip(zip).pipe(
      switchMap(loc => (loc ? this.getCurrentObservationByLatLon(loc.lat, loc.lon) : of(null))),
      catchError(() => of(null)),
      shareReplay(1)
    );

    this.cache.set(key, obs);
    return obs;
  }
}
