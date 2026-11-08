import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { AdminListPassengersUseCase } from "@application/use-cases/admin-passengers/list-passengers.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminListPassengersQueryDto } from "./dtos/passengers/list-passengers.query.dto";

@ApiTags("admin-passengers")
@Controller("admin/passengers")
@UseGuards(AdminAuthGuard)
export class AdminPassengersController {
  constructor(
    private readonly listPassengersUseCase: AdminListPassengersUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List saved passengers across users",
    description:
      "Supports pagination, search, sorting, and filtering by owner user ID.",
  })
  list(@Query() query: AdminListPassengersQueryDto) {
    return this.listPassengersUseCase.execute({
      userId: query.userId,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }
}
