import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../../user/user.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { User } from 'src/user/user.schema';
import { ContextWithJWTPayload } from 'src/auth/types/context';
import {
  AddFavoritePayload,
  RemoveFavoritePayload,
  ReorderFavoritesPayload,
} from '../me.favorites.payloads.dto';

@Resolver('Me')
export class MeResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  @UseGuards(AuthGuard)
  async getMe(@Context() context: ContextWithJWTPayload): Promise<User> {
    return this.userService.getById(context.jwtPayload.id);
  }

  @Mutation(() => AddFavoritePayload)
  @UseGuards(AuthGuard)
  async addFavorite(
    @Args('activityId') activityId: string,
    @Context() context: ContextWithJWTPayload,
  ): Promise<AddFavoritePayload> {
    const user = await this.userService.addFavorite(
      context.jwtPayload.id,
      activityId,
    );

    return {
      activityId,
      isFavorite: true,
      favoritesCount: user.favorites?.length ?? 0,
    };
  }

  @Mutation(() => RemoveFavoritePayload)
  @UseGuards(AuthGuard)
  async removeFavorite(
    @Args('activityId') activityId: string,
    @Context() context: ContextWithJWTPayload,
  ): Promise<RemoveFavoritePayload> {
    const user = await this.userService.removeFavorite(
      context.jwtPayload.id,
      activityId,
    );

    return {
      activityId,
      isFavorite: false,
      favoritesCount: user.favorites?.length ?? 0,
    };
  }

  @Mutation(() => ReorderFavoritesPayload)
  @UseGuards(AuthGuard)
  async reorderFavorites(
    @Args({ name: 'ids', type: () => [String] }) ids: string[],
    @Context() context: ContextWithJWTPayload,
  ): Promise<ReorderFavoritesPayload> {
    const user = await this.userService.reorderFavorites(
      context.jwtPayload.id,
      ids,
    );

    return {
      ids: (user.favorites ?? []).map((id) => id.toString()),
      favoritesCount: user.favorites?.length ?? 0,
    };
  }
}
