import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeatherService]
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('resolves ZIP to lat/lon via zippopotam', (done) => {
    service.getLatLonByZip('94103').subscribe(res => {
      expect(res).toBeTruthy();
      expect(res?.lat).toBeCloseTo(37.77, 1);
      done();
    });

    const req = httpMock.expectOne('https://api.zippopotam.us/us/94103');
    req.flush({ 'post code': '94103', country: 'United States', places: [{ 'place name': 'San Francisco', latitude: '37.7725', longitude: '-122.4147', state: 'California' }] });
  });
});
