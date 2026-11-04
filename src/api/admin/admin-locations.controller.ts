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
import { ListLocationDateOverridesUseCase } from "@application/use-cases/admin-locations/list-location-date-overrides.use-case";
import { CreateLocationDateOverrideUseCase } from "@application/use-cases/admin-locations/create-location-date-override.use-case";
import { UpdateLocationDateOverrideUseCase } from "@application/use-cases/admin-locations/update-location-date-override.use-case";
import { DeleteLocationDateOverrideUseCase } from "@application/use-cases/admin-locations/delete-location-date-override.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { ListLocationsQueryDto } from "./dtos/locations/list-locations.query.dto";
import { UpdateLocationDto } from "./dtos/locations/update-location.dto";
import { CreateLocationDateOverrideDto } from "./dtos/location-date-overrides/create-location-date-override.dto";
import { UpdateLocationDateOverrideDto } from "./dtos/location-date-overrides/update-location-date-override.dto";
import { ListLocationDateOverridesQueryDto } from "./dtos/location-date-overrides/list-location-date-overrides.query.dto";

@ApiTags("admin-locations")
@Controller("admin/locations")
@UseGuards(AdminAuthGuard)
export class AdminLocationsController {
  constructor(
    private readonly listLocationsUseCase: ListLocationsUseCase,
    private readonly updateLocationUseCase: UpdateLocationUseCase,
    private readonly listLocationDateOverridesUseCase: ListLocationDateOverridesUseCase,
    private readonly createLocationDateOverrideUseCase: CreateLocationDateOverrideUseCase,
    private readonly updateLocationDateOverrideUseCase: UpdateLocationDateOverrideUseCase,
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

  @Post(":locationId/date-overrides")
  @ApiOperation({ summary: "Create a date-specific location override" })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiBody({ type: CreateLocationDateOverrideDto })
  @ApiResponse({ status: 201, description: "Date override created" })
  @ApiResponse({ status: 404, description: "Location not found" })
  @ApiResponse({ status: 409, description: "Override already exists" })
  createDateOverride(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Body() dto: CreateLocationDateOverrideDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.createLocationDateOverrideUseCase.execute({
      actorUserId: req.user.id,
      locationId,
      date: dto.date,
      capacity: dto.capacity,
      fee: dto.fee,
    });
  }

  @Patch(":locationId/date-overrides/:overrideId")
  @ApiOperation({ summary: "Update a date-specific location override" })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiParam({ name: "overrideId", format: "uuid" })
  @ApiBody({ type: UpdateLocationDateOverrideDto })
  @ApiResponse({ status: 200, description: "Date override updated" })
  @ApiResponse({ status: 404, description: "Date override not found" })
  updateDateOverride(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Param("overrideId", ParseUUIDPipe) overrideId: string,
    @Body() dto: UpdateLocationDateOverrideDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updateLocationDateOverrideUseCase.execute({
      actorUserId: req.user.id,
      locationId,
      overrideId,
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
