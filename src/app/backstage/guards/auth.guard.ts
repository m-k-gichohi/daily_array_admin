import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "src/app/services/auth.service";

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialise on first load
  if (auth.loading()) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.loading()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  if (auth.isLoggedIn()) {
    return true;
  }

  // Not logged in — redirect to backstage login
  return router.createUrlTree(["/backstage"]);
};

export const publicGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If already logged in, redirect to dashboard
  if (auth.isLoggedIn()) {
    return router.createUrlTree(["/backstage/dashboard"]);
  }
  return true;
};
