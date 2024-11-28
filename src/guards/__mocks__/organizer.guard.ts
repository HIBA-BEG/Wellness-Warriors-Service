import { Injectable, CanActivate } from '@nestjs/common';

@Injectable()
export class OrganizerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
