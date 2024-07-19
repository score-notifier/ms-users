import { IsUUID } from 'class-validator';

export class GetSubscriptionsDto {
  @IsUUID()
  teamId: string;

  @IsUUID()
  leagueId: string;
}
