import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserProfileDto, CreateSubscriptionDto } from './dto';
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
}
