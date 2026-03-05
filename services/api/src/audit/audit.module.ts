import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuditController } from "./audit.controller";
import { AuditAdminController } from "./audit.admin.controller";

@Global()
@Module({
  providers: [AuditService],
  controllers: [AuditController, AuditAdminController],
  exports: [AuditService],
})
export class AuditModule {}