import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";

function now() {
  return new Date();
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private accessTtlSeconds() {
    return Number(this.config.get("ADMIN_ACCESS_TTL_SECONDS") ?? 900);
  }

  private refreshTtlDays() {
    return Number(this.config.get("ADMIN_REFRESH_TTL_DAYS") ?? 30);
  }

  private async signAccessToken(userId: string) {
    const payload = { sub: userId, typ: "admin_access" };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: `${this.accessTtlSeconds()}s`,
    });
  }

  private async signRefreshToken(sessionId: string, userId: string) {
    const payload = { sub: userId, sid: sessionId, typ: "admin_refresh" };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: `${this.refreshTtlDays()}d`,
    });
  }

  async login(input: { email?: string; phone?: string; password: string }) {
    if (!input.email && !input.phone) {
      throw new BadRequestException("email or phone is required");
    }

    const user = await this.prisma.adminUser.findFirst({
      where: {
        isActive: true,
        OR: [
          input.email ? { email: input.email.toLowerCase() } : undefined,
          input.phone ? { phone: input.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    // session refresh (hashé en DB)
    const refreshHash = await bcrypt.hash(
      `seed-${user.id}-${Date.now()}-${Math.random()}`,
      10,
    );

    const session = await this.prisma.adminSession.create({
      data: {
        userId: user.id,
        refreshHash,
        expiresAt: addDays(now(), this.refreshTtlDays()),
      },
    });

    const accessToken = await this.signAccessToken(user.id);
    const refreshToken = await this.signRefreshToken(session.id, user.id);

    // Stocker le hash du refresh token réel (optionnel): ici on remplace refreshHash
    // pour lier le token à la session
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { refreshHash: tokenHash },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, phone: user.phone, fullName: user.fullName },
    };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload?.typ !== "admin_refresh" || !payload?.sid || !payload?.sub) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.prisma.adminSession.findUnique({ where: { id: payload.sid } });
    if (!session) throw new UnauthorizedException("Invalid session");
    if (session.revokedAt) throw new UnauthorizedException("Session revoked");
    if (session.expiresAt.getTime() < Date.now()) throw new UnauthorizedException("Session expired");

    const match = await bcrypt.compare(refreshToken, session.refreshHash);
    if (!match) throw new UnauthorizedException("Invalid refresh token");

    const accessToken = await this.signAccessToken(payload.sub);
    return { accessToken };
  }

  async logout(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      // logout idempotent
      return { ok: true };
    }

    if (payload?.typ !== "admin_refresh" || !payload?.sid) return { ok: true };

    await this.prisma.adminSession.update({
      where: { id: payload.sid },
      data: { revokedAt: new Date() },
    }).catch(() => undefined);

    return { ok: true };
  }
}