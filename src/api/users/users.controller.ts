import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";

import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { User } from "@domain/entities/user.entity";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import { GetCurrentUserUseCase } from "@application/use-cases/users/get-current-user.use-case";
import { GetUserBalancesUseCase } from "@application/use-cases/users/get-user-balances.use-case";
import { ListUserLedgersUseCase } from "@application/use-cases/users/list-user-ledgers.use-case";

import { AuthenticatedUserResponseDto } from "../auth/dtos/authenticated-user.response.dto";

import { ListUserBalancesQueryDto } from "./dtos/list-user-balances.query.dto";
import { ListUserLedgersQueryDto } from "./dtos/list-user-ledgers.query.dto";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

@ApiTags("users")
@Controller("users")
@UseGuards(TmarAuthGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getCurrentUserBalancesUseCase: GetUserBalancesUseCase,
    private readonly listUserLedgersUseCase: ListUserLedgersUseCase,
  ) {}

  @Get("me")
  @ApiOperation({
    summary: "Get the currently authenticated user's profile",
  })
  @ApiResponse({
    status: 200,
    description: "Current user profile",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated",
  })
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.getCurrentUserUseCase.execute(req.user.id);

    return this.toUserResponse(user);
  }

  @Get("me/balances")
  @ApiOperation({
    summary: "Get the currently authenticated user's balances",
    description:
      "Returns a paginated list of balances belonging to the currently authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: "Current user's balances",
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated",
  })
  async getMyBalances(
    @Query() query: ListUserBalancesQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.getCurrentUserBalancesUseCase.execute(req.user.id, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Get("me/ledgers")
  @ApiOperation({
    summary: "List the current user's ledger entries",
    description:
      "Returns paginated financial ledger entries belonging only to the authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated ledger entries",
  })
  async getMyLedgers(
    @Query() query: ListUserLedgersQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.listUserLedgersUseCase.execute({
      userId: req.user.id,
      page: query.page,
      limit: query.limit,
      type: query.type,
      currency: query.currency,
      referenceId: query.referenceId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      bio: user.bio,
    };
  }
}
