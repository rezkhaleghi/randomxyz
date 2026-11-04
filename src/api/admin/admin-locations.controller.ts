import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ListLocationsUseCase } from "@application/use-cases/admin-locations/list-locations.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { ListLocationsQueryDto } from "./dtos/locations/list-locations.query.dto";

@ApiTags("admin-locations")
@Controller("admin/locations")
@UseGuards(AdminAuthGuard)
export class AdminLocationsController {
  constructor(private readonly listLocationsUseCase: ListLocationsUseCase) {}

  @Get()
  @ApiOperation({
    summary: "List and search locations",
    description:
      "List synchronized locations with pagination and filters for availability and local enablement.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated location list",
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required",
  })
  @ApiResponse({
    status: 403,
    description: "Administrator access required",
  })
  list(@Query() query: ListLocationsQueryDto) {
    return this.listLocationsUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isAvailable: query.isAvailable,
      isEnabled: query.isEnabled,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }
}
