import { ResolveFn } from '@angular/router';

export const pinsResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};
