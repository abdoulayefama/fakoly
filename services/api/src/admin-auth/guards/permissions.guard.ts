import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.adminUserId;

    if (!userId) throw new ForbiddenException();

    const roles = await this.prisma.adminUserRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            perms: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();

    for (const r of roles) {
      for (const p of r.role.perms) {
        permissions.add(p.permission.code);
      }
    }

    const ok = required.every((p) => permissions.has(p));

    if (!ok) throw new ForbiddenException("Missing permission");

    return true;
  }
}