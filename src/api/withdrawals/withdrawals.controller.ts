import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import { CreateWithdrawalUseCase } from "@application/use-cases/withdrawals/create-withdrawal.use-case";
import { ListWithdrawalsUseCase } from "@application/use-cases/withdrawals/list-withdrawals.use-case";
import { GetWithdrawalUseCase } from "@application/use-cases/withdrawals/get-withdrawal.use-case";

import { ListWithdrawalsQueryDto } from "./dtos/list-withdrawals.query.dto";
import { CreateWithdrawalDto } from "./dtos/create-withdrawal.dto";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

@ApiTags("withdrawals")
@Controller("withdrawals")
@UseGuards(TmarAuthGuard)
export class WithdrawalsController {
  constructor(
    private readonly createWithdrawalUseCase: CreateWithdrawalUseCase,
    private readonly listWithdrawalsUseCase: ListWithdrawalsUseCase,
    private readonly getWithdrawalUseCase: GetWithdrawalUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List my withdrawals" })
  @ApiResponse({ status: 200, description: "Withdrawal list" })
  async list(
    @Query() query: ListWithdrawalsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.listWithdrawalsUseCase.execute({
      userId: req.user.id,
      page: query.page,
      limit: query.limit,
      currency: query.currency,
      status: query.status,
      id: query.id,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get my withdrawal" })
  @ApiResponse({ status: 200, description: "Withdrawal record" })
  async get(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.getWithdrawalUseCase.execute({
      userId: req.user.id,
      id,
    });
  }

  @Post()
  @ApiOperation({ summary: "Request a withdrawal" })
  @ApiResponse({ status: 201, description: "Withdrawal created" })
  async create(
    @Body() dto: CreateWithdrawalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.createWithdrawalUseCase.execute({
      userId: req.user.id,
      currency: dto.currency,
      amount: dto.amount,
      destination: dto.destination,
    });
  }
}
