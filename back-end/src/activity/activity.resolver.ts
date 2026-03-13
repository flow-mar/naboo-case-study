import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  Int,
  Parent,
  ResolveField,
  ID,
} from '@nestjs/graphql';
import {
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Activity } from './activity.schema';

import { CreateActivityInput } from './activity.inputs.dto';
import { User } from 'src/user/user.schema';
import { ContextWithJWTPayload } from 'src/auth/types/context';

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(private readonly activityService: ActivityService) {}

  @ResolveField(() => ID)
  id(@Parent() activity: Activity): string {
    return activity._id.toString();
  }

  @ResolveField(() => User)
  async owner(
    @Parent() activity: Activity,
    @Context() context: ContextWithJWTPayload,
  ): Promise<User> {
    const ownerValue: User = activity.owner;
    const ownerId = ownerValue?._id.toString() ?? ownerValue.toString();
    if (!ownerId) {
      throw new BadRequestException('Activity owner is missing');
    }

    const user = await context.loaders.userById.load(ownerId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ResolveField(() => Date, { nullable: true })
  createdAt(
    @Parent() activity: Activity,
    @Context() context: ContextWithJWTPayload,
  ): Date | null {
    if (context.jwtPayload?.role === 'admin') {
      return activity.createdAt;
    }
    return null;
  }

  @Query(() => [Activity])
  async getActivities(): Promise<Activity[]> {
    return this.activityService.findAll();
  }

  @Query(() => [Activity])
  async getLatestActivities(): Promise<Activity[]> {
    return this.activityService.findLatest();
  }

  @Query(() => [Activity])
  @UseGuards(AuthGuard)
  async getActivitiesByUser(
    @Context() context: ContextWithJWTPayload,
  ): Promise<Activity[]> {
    return this.activityService.findByUser(context.jwtPayload.id);
  }

  @Query(() => [String])
  async getCities(): Promise<string[]> {
    const cities = await this.activityService.findCities();
    return cities;
  }

  @Query(() => [Activity])
  async getActivitiesByCity(
    @Args('city') city: string,
    @Args({ name: 'activity', nullable: true }) activity?: string,
    @Args({ name: 'price', nullable: true, type: () => Int }) price?: number,
  ): Promise<Activity[]> {
    return this.activityService.findByCity(city, activity, price);
  }

  @Query(() => Activity)
  async getActivity(@Args('id') id: string): Promise<Activity> {
    return this.activityService.findOne(id);
  }

  @Mutation(() => Activity)
  @UseGuards(AuthGuard)
  async createActivity(
    @Context() context: ContextWithJWTPayload,
    @Args('createActivityInput') createActivity: CreateActivityInput,
  ): Promise<Activity> {
    return this.activityService.create(context.jwtPayload.id, createActivity);
  }
}
