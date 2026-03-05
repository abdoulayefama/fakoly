import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers["authorization"] as string | undefined;
    if (!auth?.startsWith("Bearer ")) throw new UnauthorizedException("Missing bearer token");

    const token = auth.slice("Bearer ".length).trim();

    try {
      const payload: any = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>("JWT_ACCESS_SECRET"),
      });

      if (payload?.typ !== "admin_access" || !payload?.sub) {
        throw new UnauthorizedException("Invalid token");
      }

      req.adminUserId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}