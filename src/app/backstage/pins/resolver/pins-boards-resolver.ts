import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PinsBoardsService } from '../services/pins-boards';
import { PinterestBoard } from '../model/pin-boards';

export const pinsBoardsResolver: ResolveFn<PinterestBoard[]> = (route, state) => {
  const pinterestService = inject(PinsBoardsService);
  return pinterestService.getAllBoards();
};
