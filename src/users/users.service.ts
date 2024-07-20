import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import {
  CreateUserProfileDto,
  CreateSubscriptionDto,
  GetSubscriptionsDto,
} from './dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async createUserProfile(createUserProfileDto: CreateUserProfileDto) {
    try {
      this.logger.log('Creating new user profile', createUserProfileDto);

      const { email, name, address } = createUserProfileDto;

      const user = await this.userProfile.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'User already exists',
        });
      }

      return this.userProfile.create({
        data: {
          email,
          name,
          address,
        },
      });
    } catch (error) {
      throw new RpcException({
        status: error.status || HttpStatus.BAD_REQUEST,
        message: error.message || 'Error creating user profile',
      });
    }
  }

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    try {
      this.logger.log('Creating new user subscription', createSubscriptionDto);

      const { userId, teamId, leagueId } = createSubscriptionDto;

      const leagueExists = await this.checkLeagueExists(leagueId);
      const teamExists = await this.checkTeamExists(teamId);

      if (!leagueExists || !teamExists) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'League or Team not found',
        });
      }

      const user = await this.userProfile.findUnique({
        where: {
          id: userId,
        },
        include: {
          subscriptions: true,
        },
      });

      if (!user) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        });
      }

      const existingSubscription = await this.subscription.findFirst({
        where: {
          userId,
          teamId,
          leagueId,
        },
      });

      if (existingSubscription) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'User is already subscribed to this team and league',
        });
      }

      return await this.subscription.create({
        data: {
          userId,
          teamId,
          leagueId,
          active: true,
        },
      });
    } catch (error) {
      throw new RpcException({
        status: error.status || HttpStatus.BAD_REQUEST,
        message: error.message || 'Error creating subscription',
      });
    }
  }

  async getSubscriptions({ teamId, leagueId }: GetSubscriptionsDto) {
    try {
      return this.subscription.findMany({
        where: {
          teamId: teamId,
          leagueId: leagueId,
          active: true,
        },
      });
    } catch (error) {
      this.logger.error('Error getting user subscriptions', error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message || 'Error getting user subscriptions',
      });
    }
  }

  async getUserSubscriptions(userId: string) {
    try {
      const userExists = await this.checkUserExists(userId);

      if (!userExists) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        });
      }

      const subscriptions = await this.subscription.findMany({
        where: {
          userId,
        },
      });

      return await Promise.all(
        subscriptions.map(async (subscription) => {
          const { id, teamId, leagueId, active, createdAt, userId } =
            subscription;
          const [team, league] = await Promise.all([
            firstValueFrom(
              this.client.send('competitions.team.id', {
                teamId,
              }),
            ),
            firstValueFrom(
              this.client.send('competitions.league.id', {
                leagueId,
              }),
            ),
          ]);

          return {
            userId,
            active,
            id,
            createdAt,
            team,
            league,
          };
        }),
      );
    } catch (error) {
      this.logger.error(`Error getting user subscriptions ${userId}`, error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message || `Error getting user subscriptions ${userId}`,
      });
    }
  }

  async getUsers() {
    try {
      return this.userProfile.findMany({});
    } catch (error) {
      this.logger.error('Error getting user subscriptions', error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message || 'Error getting user subscriptions',
      });
    }
  }

  async checkUserExists(userId: string): Promise<boolean> {
    const user = await this.userProfile.findUnique({
      where: { id: userId },
    });
    return !!user;
  }

  private async checkLeagueExists(leagueId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.client.send('competitions.league.exists', { leagueId }),
    );
    return result.exists;
  }

  private async checkTeamExists(teamId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.client.send('competitions.team.exists', { teamId }),
    );
    return result.exists;
  }
}
