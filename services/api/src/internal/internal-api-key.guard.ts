import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const expected = this.config.get<string>("INTERNAL_API_KEY");
    const provided = req.headers["x-internal-api-key"];

    if (!expected) throw new UnauthorizedException("Internal key not configured");
    if (!provided || provided !== expected) throw new UnauthorizedException("Invalid internal api key");
    return true;
  }
}