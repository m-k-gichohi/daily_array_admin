import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { pinsBoardsResolver } from './pins-boards-resolver';

describe('pinsBoardsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => pinsBoardsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
