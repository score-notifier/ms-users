import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateUserProfileDto,
  CreateSubscriptionDto,
  GetSubscriptionsDto,
} from './dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('user.register.profile')
  async createUser(@Payload() createUserProfileDto: CreateUserProfileDto) {
    return this.usersService.createUserProfile(createUserProfileDto);
  }

  @MessagePattern('user.subscribe.team')
  async subscribeToTeam(
    @Payload() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.usersService.createSubscription(createSubscriptionDto);
  }

  @MessagePattern('user.get.subscriptions.all')
  async getSubscriptions(@Payload() getSubscriptionsDto: GetSubscriptionsDto) {
    return this.usersService.getSubscriptions(getSubscriptionsDto);
  }

  @MessagePattern('user.get.subscriptions')
  async getUserSubscriptions(@Payload('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.getUserSubscriptions(userId);
  }

  @MessagePattern('user.exists')
  async checkUserExists(@Payload('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.checkUserExists(userId);
  }

  @MessagePattern('user.get.all')
  async getUsers() {
    return this.usersService.getUsers();
  }
}
