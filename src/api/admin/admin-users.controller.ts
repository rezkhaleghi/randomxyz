import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/authenticated-request.type";

import { CreateAdminUserUseCase } from "@application/use-cases/admin-users/create-user.use-case";
import { GetUserUseCase } from "@application/use-cases/admin-users/get-user.use-case";
import { ListUsersUseCase } from "@application/use-cases/admin-users/list-users.use-case";
import { GetAuditLogsUseCase } from "@application/use-cases/admin-users/get-audit-logs.use-case";
import { GetAdminStatisticsUseCase } from "@application/use-cases/admin-users/get-statistics.use-case";
import { UpdateUserRoleUseCase } from "@application/use-cases/admin-users/update-user-role.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";

import { AdminUserResponseDto } from "./dtos/users/admin-user.response.dto";
import { AdminUserListResponseDto } from "./dtos/users/admin-user-list.response.dto";

import { UserStatus } from "@domain/enums/user-status.enum";
import { ListAuditLogsQueryDto } from "./dtos/audit-logs/list-audit-logs.query.dto";
import { ListUsersQueryDto } from "./dtos/users/list-users.query.dto";
import { CreateUserDto } from "./dtos/users/create-user.dto";
import { UpdateUserRoleDto } from "./dtos/users/update-user-role.dto";

@Controller("admin/users")
@ApiTags("admin-users")
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly createUserUseCase: CreateAdminUserUseCase,
    private readonly getAdminStatisticsUseCase: GetAdminStatisticsUseCase,
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
  ) {}

  @Get("statistics")
  @ApiOperation({
    summary: "Get admin dashboard statistics",
  })
  @ApiResponse({
    status: 200,
    description: "Admin statistics",
  })
  async statistics() {
    return this.getAdminStatisticsUseCase.execute();
  }

  @Get("audit-logs")
  @ApiOperation({
    summary: "Get admin audit logs",
    description:
      "List audit logs with optional filtering by action, actor, target user, and date range.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated audit log list",
  })
  async auditLogs(@Query() query: ListAuditLogsQueryDto) {
    const result = await this.getAuditLogsUseCase.execute(
      {
        action: query.action,
        actorUserId: query.actorUserId,
        targetUserId: query.targetUserId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      },
      {
        page: query.page,
        limit: query.limit,
        sortBy: "createdAt",
        sortDirection: query.sortDirection,
      },
    );

    return {
      ...result,
      data: result.data,
    };
  }

  @Get()
  @ApiOperation({
    summary: "List and search users",
    description:
      "List users with pagination, sorting, filtering, and prefix search by email, username, first name, last name, or full name.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated user list",
    type: AdminUserListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required",
  })
  @ApiResponse({
    status: 403,
    description: "Administrator access required",
  })
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsersUseCase.execute(query);

    return {
      ...result,
      data: result.data.map((user) => this.toResponse(user)),
    };
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get one user by ID",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "User details",
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.toResponse(await this.getUserUseCase.execute(id));
  }

  @Patch(":id/role")
  @ApiOperation({
    summary: "Update a user's Tmar-Cert role",
    description:
      "Changes only the locally managed Tmar-Cert role. The TmarTravel role is synchronized separately from the user's JWT.",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "User role updated",
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Administrator access required",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async updateRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = await this.updateUserRoleUseCase.execute(
      id,
      dto.role,
      req.user.id,
    );

    return this.toResponse(user);
  }

  @Post()
  @ApiOperation({
    summary: "Create a user or administrator",
  })
  @ApiResponse({
    status: 201,
    description: "User created",
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Email already exists",
  })
  async create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    return this.toResponse(
      await this.createUserUseCase.execute(dto, req.user.id),
    );
  }

  private toResponse(user: {
    id: string;
    email: string;
    role: string;
    tmarTravelRole: string;
    emailVerified: boolean;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
    dateOfBirth: Date | null;
    avatar: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
    status: UserStatus;
  }): AdminUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as AdminUserResponseDto["role"],
      tmarTravelRole:
        user.tmarTravelRole as AdminUserResponseDto["tmarTravelRole"],
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      status: user.status,
    };
  }
}
