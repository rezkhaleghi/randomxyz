import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CreatePermitUseCase } from "@application/use-cases/permits/create-permit.use-case";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import { CreatePermitDto } from "./dtos/create-permit.dto";

@ApiTags("permits")
@Controller("permits")
@UseGuards(TmarAuthGuard)
export class PermitsController {
  constructor(private readonly createPermitUseCase: CreatePermitUseCase) {}

  @Post()
  @ApiOperation({
    summary: "Create and pay for a permit",
  })
  @ApiResponse({
    status: 201,
    description: "Permit created and confirmed.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid permit information or insufficient balance.",
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated.",
  })
  @ApiResponse({
    status: 404,
    description: "Location not found.",
  })
  @ApiResponse({
    status: 409,
    description: "Location capacity is insufficient.",
  })
  create(@Body() dto: CreatePermitDto, @Req() req: AuthenticatedRequest) {
    return this.createPermitUseCase.execute({
      userId: req.user.id,
      locationId: dto.locationId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      passengers: dto.passengers,
      vehicles: dto.vehicles,
    });
  }
}
