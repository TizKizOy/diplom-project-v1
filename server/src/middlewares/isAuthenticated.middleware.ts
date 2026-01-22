import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class IsAuthenticatedMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: any) => void) {}
}
