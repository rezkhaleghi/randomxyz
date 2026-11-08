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

import { CreatePassengerUseCase } from "@application/use-cases/passengers/create-passenger.use-case";
import { DeletePassengerUseCase } from "@application/use-cases/passengers/delete-passenger.use-case";
import { ListPassengersUseCase } from "@application/use-cases/passengers/list-passengers.use-case";
import { UpdatePassengerUseCase } from "@application/use-cases/passengers/update-passenger.use-case";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import { CreatePassengerDto } from "./dtos/create-passenger.dto";
import { ListPassengersQueryDto } from "./dtos/list-passengers.query.dto";
import { UpdatePassengerDto } from "./dtos/update-passenger.dto";

@ApiTags("passengers")
@Controller("passengers")
@UseGuards(TmarAuthGuard)
export class PassengersController {
  constructor(
    private readonly listPassengersUseCase: ListPassengersUseCase,
    private readonly createPassengerUseCase: CreatePassengerUseCase,
    private readonly updatePassengerUseCase: UpdatePassengerUseCase,
    private readonly deletePassengerUseCase: DeletePassengerUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the current user's saved passengers" })
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListPassengersQueryDto,
  ) {
    return this.listPassengersUseCase.execute({
      userId: req.user.id,
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Post()
  @ApiOperation({ summary: "Create or retrieve a saved passenger" })
  create(@Body() dto: CreatePassengerDto, @Req() req: AuthenticatedRequest) {
    return this.createPassengerUseCase.execute({
      userId: req.user.id,
      fullName: dto.fullName,
      nationalId: dto.nationalId,
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a saved passenger" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePassengerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updatePassengerUseCase.execute({
      id,
      userId: req.user.id,
      fullName: dto.fullName,
      nationalId: dto.nationalId,
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a saved passenger" })
  delete(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.deletePassengerUseCase.execute({
      id,
      userId: req.user.id,
    });
  }
}
