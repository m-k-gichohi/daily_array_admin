import { TestBed } from '@angular/core/testing';

import { PinsBoards } from './pins-boards';

describe('PinsBoards', () => {
  let service: PinsBoards;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PinsBoards);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
