import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CreatePermitUseCase } from "@application/use-cases/permits/create-permit.use-case";
import { EndPermitUseCase } from "@application/use-cases/permits/end-permit.use-case";
import { GetPermitUseCase } from "@application/use-cases/permits/get-permit.use-case";
import { ListPermitsUseCase } from "@application/use-cases/permits/list-permits.use-case";
import { VerifyPermitUseCase } from "@application/use-cases/permits/verify-permit.use-case";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import { CreatePermitDto } from "./dtos/create-permit.dto";

@ApiTags("permits")
@Controller("permits")
export class PermitsController {
  constructor(
    private readonly createPermitUseCase: CreatePermitUseCase,
    private readonly listPermitsUseCase: ListPermitsUseCase,
    private readonly getPermitUseCase: GetPermitUseCase,
    private readonly endPermitUseCase: EndPermitUseCase,
    private readonly verifyPermitUseCase: VerifyPermitUseCase,
  ) {}

  @Post()
  @UseGuards(TmarAuthGuard)
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

  @Get()
  @UseGuards(TmarAuthGuard)
  @ApiOperation({
    summary: "List the current user's permits",
  })
  @ApiResponse({
    status: 200,
    description: "Current user's permits.",
  })
  list(@Req() req: AuthenticatedRequest) {
    return this.listPermitsUseCase.execute(req.user.id);
  }

  @Get("verify/:qrToken")
  @ApiOperation({
    summary: "Verify a permit QR token",
    description:
      "Public endpoint. Returns permit status, location, passenger count, and leader details only.",
  })
  @ApiResponse({
    status: 200,
    description: "Permit verification details.",
  })
  @ApiResponse({
    status: 404,
    description: "Permit not found.",
  })
  verify(@Param("qrToken") qrToken: string) {
    if (!/^[a-f0-9]{64}$/i.test(qrToken)) {
      throw new NotFoundException("Permit not found.");
    }

    return this.verifyPermitUseCase.execute(qrToken);
  }

  @Get(":permitId")
  @UseGuards(TmarAuthGuard)
  @ApiOperation({
    summary: "Get permit details",
    description:
      "Returns permit details, passengers, vehicles, and QR token. Only the permit owner can access it.",
  })
  @ApiParam({
    name: "permitId",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Permit details.",
  })
  @ApiResponse({
    status: 404,
    description: "Permit not found.",
  })
  get(
    @Param("permitId", ParseUUIDPipe) permitId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.getPermitUseCase.execute({
      userId: req.user.id,
      permitId,
    });
  }

  @Patch(":permitId/end")
  @UseGuards(TmarAuthGuard)
  @ApiOperation({
    summary: "End a permit",
    description:
      "Ends a confirmed or expired permit. Ending a permit does not refund its payment.",
  })
  @ApiParam({
    name: "permitId",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Permit ended successfully.",
  })
  @ApiResponse({
    status: 404,
    description: "Permit not found.",
  })
  @ApiResponse({
    status: 409,
    description: "Permit cannot be ended in its current status.",
  })
  end(
    @Param("permitId", ParseUUIDPipe) permitId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.endPermitUseCase.execute({
      userId: req.user.id,
      permitId,
    });
  }
}
