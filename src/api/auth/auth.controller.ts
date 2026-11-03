import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { OtpService } from "@application/interfaces/otp.service.interface";

import { AuthSessionGuard } from "./auth-session.guard";
import { RequestOtpDto } from "./dtos/request-otp.dto";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

/**
 * Authentication controller.
 *
 * Responsible only for authentication and session-related HTTP endpoints.
 *
 * Profile and user-management operations belong to UsersController.
 */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,

    private readonly otpService: OtpService,
  ) {}

  @Post("request-otp")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: "Send a one-time password to the given email",
  })
  @ApiResponse({
    status: 201,
    description: "OTP sent",
  })
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.otpService.generateAndSend(dto.email);

    return {
      message: "OTP sent",
    };
  }
}
