import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../../user/user.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { User } from 'src/user/user.schema';
import { ContextWithJWTPayload } from 'src/auth/types/context';

@Resolver('Me')
export class MeResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  @UseGuards(AuthGuard)
  async getMe(@Context() context: ContextWithJWTPayload): Promise<User> {
    return (await this.userService.getById(context.jwtPayload.id)).populate(
      'favorites',
    );
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard)
  async addFavorite(
    @Args('activityId') activityId: string,
    @Context() context: ContextWithJWTPayload,
  ): Promise<User> {
    return (
      await this.userService.addFavorite(context.jwtPayload.id, activityId)
    ).populate('favorites');
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard)
  async removeFavorite(
    @Args('activityId') activityId: string,
    @Context() context: ContextWithJWTPayload,
  ): Promise<User> {
    return (
      await this.userService.removeFavorite(context.jwtPayload.id, activityId)
    ).populate('favorites');
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard)
  async reorderFavorites(
    @Args({ name: 'ids', type: () => [String] }) ids: string[],
    @Context() context: ContextWithJWTPayload,
  ): Promise<User> {
    return (
      await this.userService.reorderFavorites(context.jwtPayload.id, ids)
    ).populate('favorites');
  }
}
