import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AdminAuthService } from "./admin-auth.service";
import { AdminLoginDto } from "./dto/login.dto";
import { AdminRefreshDto } from "./dto/refresh.dto";
import { AdminJwtGuard } from "./guards/admin-jwt.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("/admin/auth")
export class AdminAuthController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("/login")
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login({ email: dto.email, phone: dto.phone, password: dto.password });
  }

  @Post("/refresh")
  refresh(@Body() dto: AdminRefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("/logout")
  logout(@Body() dto: AdminRefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get("/me")
  @UseGuards(AdminJwtGuard)
  async me(@Req() req: any) {
    const userId = req.adminUserId as string;
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, fullName: true, isActive: true, createdAt: true },
    });
    return user;
  }
}