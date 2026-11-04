import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import { AdminListPermitsUseCase } from "@application/use-cases/admin-permits/list-permits.use-case";
import { AdminGetPermitUseCase } from "@application/use-cases/admin-permits/get-permit.use-case";
import { AdminUpdatePermitUseCase } from "@application/use-cases/admin-permits/update-permit.use-case";
import { AdminRevokePermitUseCase } from "@application/use-cases/admin-permits/revoke-permit.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { ListPermitsQueryDto } from "./dtos/permits/list-permits.query.dto";
import { UpdatePermitDto } from "./dtos/permits/update-permit.dto";
import { RevokePermitDto } from "./dtos/permits/revoke-permit.dto";

@ApiTags("admin-permits")
@Controller("admin/permits")
@UseGuards(AdminAuthGuard)
export class AdminPermitsController {
  constructor(
    private readonly listPermitsUseCase: AdminListPermitsUseCase,
    private readonly getPermitUseCase: AdminGetPermitUseCase,
    private readonly updatePermitUseCase: AdminUpdatePermitUseCase,
    private readonly revokePermitUseCase: AdminRevokePermitUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List permits" })
  list(@Query() query: ListPermitsQueryDto) {
    return this.listPermitsUseCase.execute(query);
  }

  @Get(":permitId")
  @ApiOperation({ summary: "Get permit details for administrators" })
  @ApiParam({ name: "permitId", format: "uuid" })
  get(@Param("permitId", ParseUUIDPipe) permitId: string) {
    return this.getPermitUseCase.execute(permitId);
  }

  @Patch(":permitId/participants")
  @ApiOperation({
    summary: "Replace permit passengers and vehicles",
    description: "Only confirmed permits can be edited. A reason is required.",
  })
  updateParticipants(
    @Param("permitId", ParseUUIDPipe) permitId: string,
    @Body() dto: UpdatePermitDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updatePermitUseCase.execute({
      permitId,
      actorUserId: req.user.id,
      reason: dto.reason,
      passengers: dto.passengers,
      vehicles: dto.vehicles,
    });
  }

  @Post(":permitId/revoke")
  @ApiOperation({
    summary: "Revoke a permit and refund its payment",
    description:
      "A reason is required. Refunds are credited to the user's wallet.",
  })
  revoke(
    @Param("permitId", ParseUUIDPipe) permitId: string,
    @Body() dto: RevokePermitDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.revokePermitUseCase.execute({
      permitId,
      actorUserId: req.user.id,
      reason: dto.reason,
    });
  }
}
