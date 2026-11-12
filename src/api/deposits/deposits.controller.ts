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
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CreateDepositUseCase } from "@application/use-cases/deposits/create-deposit.use-case";
import { GetDepositUseCase } from "@application/use-cases/deposits/get-deposit.use-case";
import { ListDepositsUseCase } from "@application/use-cases/deposits/list-deposits.use-case";
import { VerifyDepositUseCase } from "@application/use-cases/deposits/verify-deposit.use-case";

import { PaymentProvider } from "@domain/enums/payment-provider.enum";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import { ListDepositsQueryDto } from "./dtos/list-deposits.query.dto";
import { CreateDepositDto } from "./dtos/create-deposit.dto";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

@ApiTags("deposits")
@Controller("deposits")
@UseGuards(TmarAuthGuard)
export class DepositsController {
  constructor(
    private readonly createDepositUseCase: CreateDepositUseCase,
    private readonly verifyDepositUseCase: VerifyDepositUseCase,
    private readonly listDepositsUseCase: ListDepositsUseCase,
    private readonly getDepositUseCase: GetDepositUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List my deposits" })
  @ApiResponse({ status: 200, description: "Deposit list" })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListDepositsQueryDto,
  ) {
    return this.listDepositsUseCase.execute({
      userId: req.user.id,
      page: query.page,
      limit: query.limit,
      currency: query.currency,
      status: query.status,
      referenceId: query.referenceId,
      providerPaymentId: query.providerPaymentId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get my deposit" })
  @ApiResponse({ status: 200, description: "Deposit record" })
  async get(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.getDepositUseCase.execute({
      userId: req.user.id,
      id,
    });
  }

  @Post()
  @ApiOperation({ summary: "Create a deposit" })
  @ApiResponse({ status: 201, description: "Deposit created" })
  async create(
    @Body() dto: CreateDepositDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const backendUrl = this.configService
      .getOrThrow<string>("BACKEND_URL")
      .replace(/\/+$/, "");

    const callbackUrl = `${backendUrl}/deposits/${dto.provider}/callback`;
    console.log(callbackUrl);

    return this.createDepositUseCase.execute({
      userId: req.user.id,
      currency: dto.currency,
      amount: dto.amount,
      provider: dto.provider,
      callbackUrl,
    });
  }

  @Post(":id/verify")
  @ApiOperation({ summary: "Verify a deposit" })
  @ApiResponse({ status: 200, description: "Deposit verified" })
  async verify(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.verifyDepositUseCase.execute({
      userId: req.user.id,
      depositId: id,
    });
  }
}
