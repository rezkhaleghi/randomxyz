import {
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";

import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { User } from "@domain/entities/user.entity";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";
import { GetCurrentUserUseCase } from "@application/use-cases/users/get-current-user.use-case";
import { UpdateUserAvatarUseCase } from "@application/use-cases/users/update-user-avatar.use-case";
import { DeleteUserAvatarUseCase } from "@application/use-cases/users/delete-user-avatar.use-case";
import { SearchUsersUseCase } from "@application/use-cases/users/search-users.use-case";
import { GetUserBalancesUseCase } from "@application/use-cases/users/get-user-balances.use-case";
import { ListUserNotificationsUseCase } from "@application/use-cases/notifications/list-user-notifications.use-case";
import { MarkNotificationReadUseCase } from "@application/use-cases/notifications/mark-notification-read.use-case";

import { AuthenticatedUserResponseDto } from "../auth/dtos/authenticated-user.response.dto";

import { ListUserBalancesQueryDto } from "./dtos/list-user-balances.query.dto";
import { SearchUsersQueryDto } from "./dtos/search-users.query.dto";
import { ListNotificationsQueryDto } from "./dtos/list-notifications.query.dto";
import { NotificationResponseDto } from "./dtos/notification.response.dto";
import type { AuthenticatedRequest } from "../auth/authenticated-request.type";
@ApiTags("users")
@Controller("users")
@UseGuards(TmarAuthGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getCurrentUserBalancesUseCase: GetUserBalancesUseCase,
    private readonly updateUserAvatarUseCase: UpdateUserAvatarUseCase,
    private readonly deleteUserAvatarUseCase: DeleteUserAvatarUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly listUserNotificationsUseCase: ListUserNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
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

  @Get("me/notifications")
  @ApiOperation({
    summary: "List the current user's notifications",
  })
  @ApiResponse({
    status: 200,
    description: "Current user's notifications",
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated",
  })
  async getMyNotifications(
    @Query() query: ListNotificationsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.listUserNotificationsUseCase.execute({
      userId: req.user.id,
      page: query.page,
      limit: query.limit,
      sortDirection: query.sortDirection,
      channel: query.channel,
      type: query.type,
    });
  }

  @Patch("me/notifications/:id/read")
  @ApiOperation({
    summary: "Mark one of the current user's in-app notifications as read",
  })
  @ApiResponse({
    status: 200,
    description: "Notification marked as read",
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Notification not found",
  })
  @ApiResponse({
    status: 400,
    description: "Notification cannot be marked as read",
  })
  async markNotificationAsRead(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.markNotificationReadUseCase.execute(req.user.id, id);
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
