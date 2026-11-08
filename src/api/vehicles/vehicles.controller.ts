import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CreateVehicleUseCase } from "@application/use-cases/vehicles/create-vehicle.use-case";
import { DeleteVehicleUseCase } from "@application/use-cases/vehicles/delete-vehicle.use-case";
import { ListVehiclesUseCase } from "@application/use-cases/vehicles/list-vehicles.use-case";
import { UpdateVehicleUseCase } from "@application/use-cases/vehicles/update-vehicle.use-case";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import {
  CreateVehicleDto,
  ListVehiclesQueryDto,
  UpdateVehicleDto,
} from "../permits/dtos/vehicles.dto";

@ApiTags("vehicles")
@Controller("vehicles")
@UseGuards(TmarAuthGuard)
export class VehiclesController {
  constructor(
    private readonly listVehiclesUseCase: ListVehiclesUseCase,
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly deleteVehicleUseCase: DeleteVehicleUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the current user's saved vehicles" })
  list(@Req() req: AuthenticatedRequest, @Query() query: ListVehiclesQueryDto) {
    return this.listVehiclesUseCase.execute({
      userId: req.user.id,
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Post()
  @ApiOperation({ summary: "Create or retrieve a saved vehicle" })
  create(@Body() dto: CreateVehicleDto, @Req() req: AuthenticatedRequest) {
    return this.createVehicleUseCase.execute({
      userId: req.user.id,
      kind: dto.kind,
      color: dto.color,
      plateId: dto.plateId,
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a saved vehicle" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updateVehicleUseCase.execute({
      id,
      userId: req.user.id,
      kind: dto.kind,
      color: dto.color,
      plateId: dto.plateId,
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a saved vehicle" })
  delete(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.deleteVehicleUseCase.execute({
      id,
      userId: req.user.id,
    });
  }
}
