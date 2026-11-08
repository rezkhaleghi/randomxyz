import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { AdminListVehiclesUseCase } from "@application/use-cases/admin-vehicles/list-vehicles.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminListVehiclesQueryDto } from "./dtos/vehicles/list-vehicles.query.dto";

@ApiTags("admin-vehicles")
@Controller("admin/vehicles")
@UseGuards(AdminAuthGuard)
export class AdminVehiclesController {
  constructor(private readonly listVehiclesUseCase: AdminListVehiclesUseCase) {}

  @Get()
  @ApiOperation({
    summary: "List saved vehicles across users",
    description:
      "Supports pagination, search, sorting, and filtering by owner user ID.",
  })
  list(@Query() query: AdminListVehiclesQueryDto) {
    return this.listVehiclesUseCase.execute({
      userId: query.userId,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }
}
