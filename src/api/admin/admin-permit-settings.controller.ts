import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";

import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import { AdminAuthGuard } from "./admin-auth.guard";

import { GetPermitSettingsUseCase } from "@application/use-cases/admin-settings/get-permit-setting.use-case";
import { UpdatePermitSettingsUseCase } from "@application/use-cases/admin-settings/update-permit-setting.use-case";

import { UpdatePermitSettingsDto } from "./dtos/settings/update-permit-setting.dto";

@ApiTags("admin-settings")
@Controller("admin/settings")
@UseGuards(AdminAuthGuard)
export class AdminPermitSettingsController {
  constructor(
    private readonly getPermitSettingsUseCase: GetPermitSettingsUseCase,
    private readonly updatePermitSettingsUseCase: UpdatePermitSettingsUseCase,
  ) {}

  @Get("permit")
  @ApiOperation({
    summary: "Get global permit settings",
  })
  @ApiResponse({
    status: 200,
    description: "Global permit settings",
  })
  getPermitSettings() {
    return this.getPermitSettingsUseCase.execute();
  }

  @Patch("permit")
  @ApiOperation({
    summary: "Update global permit settings",
  })
  @ApiBody({ type: UpdatePermitSettingsDto })
  @ApiResponse({
    status: 200,
    description: "Global permit settings updated",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid permit settings",
  })
  updatePermitSettings(
    @Body() dto: UpdatePermitSettingsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updatePermitSettingsUseCase.execute({
      actorUserId: req.user.id,
      defaultFee: dto.defaultFee,
    });
  }
}
