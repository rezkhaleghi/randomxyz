import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import { ListLocationsUseCase } from "@application/use-cases/admin-locations/list-locations.use-case";
import { UpdateLocationUseCase } from "@application/use-cases/admin-locations/update-location.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { ListLocationsQueryDto } from "./dtos/locations/list-locations.query.dto";
import { UpdateLocationDto } from "./dtos/locations/update-location.dto";

@ApiTags("admin-locations")
@Controller("admin/locations")
@UseGuards(AdminAuthGuard)
export class AdminLocationsController {
  constructor(
    private readonly listLocationsUseCase: ListLocationsUseCase,
    private readonly updateLocationUseCase: UpdateLocationUseCase,
  ) {}

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

  @Patch(":locationId")
  @ApiOperation({
    summary: "Update local location settings",
    description:
      "Update enablement, normal daily capacity, and location-specific fee. Null fee inherits the global default.",
  })
  @ApiParam({
    name: "locationId",
    format: "uuid",
  })
  @ApiBody({
    type: UpdateLocationDto,
  })
  @ApiResponse({
    status: 200,
    description: "Location settings updated",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid location settings",
  })
  @ApiResponse({
    status: 404,
    description: "Location not found",
  })
  update(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Body() dto: UpdateLocationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updateLocationUseCase.execute({
      actorUserId: req.user.id,
      id: locationId,
      isEnabled: dto.isEnabled,
      capacity: dto.capacity,
      fee: dto.fee,
    });
  }
}
