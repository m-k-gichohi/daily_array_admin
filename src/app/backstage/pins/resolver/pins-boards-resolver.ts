import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PinsBoardsService } from '../services/pins-boards';
import { PinterestAuthService } from 'src/app/services/pinterest-auth.service';
import { PinterestBoard } from '../model/pin-boards';

export const pinsBoardsResolver: ResolveFn<PinterestBoard[]> = async (route, state) => {
  const auth = inject(PinterestAuthService);
  const pinterestService = inject(PinsBoardsService);

  await auth.handleRedirectCallback(
    route.queryParamMap.get('code'),
    route.queryParamMap.get('state'),
  );

  return firstValueFrom(pinterestService.getAllBoards());
};
