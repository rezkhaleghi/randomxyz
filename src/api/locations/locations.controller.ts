import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ListLocationsUseCase } from "@application/use-cases/locations/list-locations.use-case";
import { GetLocationUseCase } from "@application/use-cases/locations/get-location.use-case";
import { GetLocationAvailabilityUseCase } from "@application/use-cases/locations/get-location-availability.use-case";

import { ListLocationsQueryDto } from "./dtos/list-locations.query.dto";
import { GetPermitAvailabilityQueryDto } from "./dtos/get-permit-availability.query.dto";

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

  @Get(":locationId/permit-availability")
  @ApiOperation({
    summary: "Get permit availability and price estimation",
    description:
      "Returns daily availability and estimated permit fees for the requested passenger and vehicle counts.",
  })
  @ApiParam({ name: "locationId", format: "uuid" })
  @ApiResponse({
    status: 200,
    description: "Daily permit availability and price estimation",
  })
  @ApiResponse({ status: 400, description: "Invalid request parameters" })
  @ApiResponse({ status: 404, description: "Location not found" })
  getPermitAvailability(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Query() query: GetPermitAvailabilityQueryDto,
  ) {
    return this.getLocationAvailabilityUseCase.execute({
      locationId,
      startDate: query.startDate,
      endDate: query.endDate,
      vehicleCount: query.vehicleCount,
      passengerCount: query.passengerCount,
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
