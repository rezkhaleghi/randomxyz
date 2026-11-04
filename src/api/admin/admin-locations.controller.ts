import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
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

import { AdminListLocationsUseCase } from "@application/use-cases/admin-locations/list-locations.use-case";
import { AdminGetLocationUseCase } from "@application/use-cases/admin-locations/get-location.use-case";
import { UpdateLocationUseCase } from "@application/use-cases/admin-locations/update-location.use-case";
import { ListLocationDateOverridesUseCase } from "@application/use-cases/admin-locations/list-location-date-overrides.use-case";
import { UpsertLocationDateOverrideUseCase } from "@application/use-cases/admin-locations/upsert-location-date-override.use-case";
import { DeleteLocationDateOverrideUseCase } from "@application/use-cases/admin-locations/delete-location-date-override.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { ListLocationsQueryDto } from "./dtos/locations/list-locations.query.dto";
import { UpdateLocationDto } from "./dtos/locations/update-location.dto";
import { UpsertLocationDateOverrideDto } from "./dtos/location-date-overrides/upsert-location-date-override.dto";
import { ListLocationDateOverridesQueryDto } from "./dtos/location-date-overrides/list-location-date-overrides.query.dto";

@ApiTags("admin-locations")
@Controller("admin/locations")
@UseGuards(AdminAuthGuard)
export class AdminLocationsController {
  constructor(
    private readonly listLocationsUseCase: AdminListLocationsUseCase,
    private readonly adminGetLocationUseCase: AdminGetLocationUseCase,
    private readonly updateLocationUseCase: UpdateLocationUseCase,
    private readonly listLocationDateOverridesUseCase: ListLocationDateOverridesUseCase,
    private readonly upsertLocationDateOverrideUseCase: UpsertLocationDateOverrideUseCase,
    private readonly deleteLocationDateOverrideUseCase: DeleteLocationDateOverrideUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List and search locations",
    description:
      "List synchronized locations with pagination and filters for availability and local enablement.",
  })
  @ApiResponse({ status: 200, description: "Paginated location list" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Administrator access required" })
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

  @Get(":locationId")
  @ApiOperation({ summary: "Get location details for administrators" })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiResponse({ status: 200, description: "Location details" })
  @ApiResponse({ status: 404, description: "Location not found" })
  get(@Param("locationId", ParseUUIDPipe) locationId: string) {
    return this.adminGetLocationUseCase.execute(locationId);
  }

  @Patch(":locationId")
  @ApiOperation({
    summary: "Update local location settings",
    description:
      "Update enablement, normal daily capacity, and location-specific fee. Null fee inherits the global default.",
  })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({ status: 200, description: "Location settings updated" })
  @ApiResponse({ status: 400, description: "Invalid location settings" })
  @ApiResponse({ status: 404, description: "Location not found" })
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

  @Get(":locationId/date-overrides")
  @ApiOperation({ summary: "List date-specific location overrides" })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiResponse({ status: 200, description: "Location date overrides" })
  @ApiResponse({ status: 404, description: "Location not found" })
  listDateOverrides(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Query() query: ListLocationDateOverridesQueryDto,
  ) {
    return this.listLocationDateOverridesUseCase.execute({
      locationId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Put(":locationId/date-overrides/:date")
  @ApiOperation({
    summary: "Create or update a date-specific location override",
    description:
      "Creates an override when none exists for the date, otherwise updates the existing override.",
  })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiParam({
    name: "date",
    example: "2026-12-21",
    description: "Calendar date in YYYY-MM-DD format.",
  })
  @ApiBody({ type: UpsertLocationDateOverrideDto })
  @ApiResponse({ status: 200, description: "Date override created or updated" })
  @ApiResponse({ status: 400, description: "Invalid date or override values" })
  @ApiResponse({ status: 404, description: "Location not found" })
  upsertDateOverride(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Param("date") date: string,
    @Body() dto: UpsertLocationDateOverrideDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.upsertLocationDateOverrideUseCase.execute({
      actorUserId: req.user.id,
      locationId,
      date,
      capacity: dto.capacity,
      fee: dto.fee,
    });
  }

  @Delete(":locationId/date-overrides/:overrideId")
  @ApiOperation({ summary: "Delete a date-specific location override" })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiParam({ name: "overrideId", format: "uuid" })
  @ApiResponse({ status: 200, description: "Date override deleted" })
  @ApiResponse({ status: 404, description: "Date override not found" })
  async deleteDateOverride(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Param("overrideId", ParseUUIDPipe) overrideId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.deleteLocationDateOverrideUseCase.execute({
      actorUserId: req.user.id,
      locationId,
      overrideId,
    });

    return { success: true };
  }
}
