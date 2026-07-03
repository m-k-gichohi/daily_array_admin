import { TestBed } from '@angular/core/testing';

import { Pins } from './pins';

describe('Pins', () => {
  let service: Pins;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pins);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
