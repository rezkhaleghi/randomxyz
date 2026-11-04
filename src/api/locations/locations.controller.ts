import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ListLocationsUseCase } from "@application/use-cases/locations/list-locations.use-case";
import { GetLocationUseCase } from "@application/use-cases/locations/get-location.use-case";
import { GetLocationAvailabilityUseCase } from "@application/use-cases/locations/get-location-availability.use-case";

import { ListLocationsQueryDto } from "./dtos/list-locations.query.dto";
import { GetLocationAvailabilityQueryDto } from "./dtos/get-location-availability.query.dto";

@ApiTags("locations")
@Controller("locations")
export class LocationsController {
  constructor(
    private readonly listLocationsUseCase: ListLocationsUseCase,
    private readonly getLocationUseCase: GetLocationUseCase,
    private readonly getLocationAvailabilityUseCase: GetLocationAvailabilityUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List available locations" })
  @ApiResponse({ status: 200, description: "Paginated location list" })
  list(@Query() query: ListLocationsQueryDto) {
    return this.listLocationsUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get(":locationId/availability")
  @ApiOperation({
    summary: "Get daily location availability and permit fees",
  })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiResponse({
    status: 200,
    description: "Daily capacity and fee information",
  })
  @ApiResponse({ status: 400, description: "Invalid date range" })
  @ApiResponse({ status: 404, description: "Location not found" })
  getAvailability(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Query() query: GetLocationAvailabilityQueryDto,
  ) {
    return this.getLocationAvailabilityUseCase.execute({
      locationId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get(":locationId")
  @ApiOperation({ summary: "Get location details" })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiResponse({ status: 200, description: "Location details" })
  @ApiResponse({ status: 404, description: "Location not found" })
  get(@Param("locationId", ParseUUIDPipe) locationId: string) {
    return this.getLocationUseCase.execute(locationId);
  }
}
