import { Args, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './user.schema';
import { Activity } from 'src/activity/activity.schema';
import {
  FavoriteEdge,
  FavoritesConnection,
  FavoritesPageInfo,
} from './user.favorites.dto';

function encodeCursor(index: number): string {
  return Buffer.from(String(index), 'utf8').toString('base64');
}

function decodeCursor(cursor: string): number {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  const index = Number.parseInt(decoded, 10);
  if (!Number.isFinite(index) || index < 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return index;
}

@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<Activity>,
  ) {}

  @ResolveField(() => FavoritesConnection)
  async favorites(
    @Parent() user: User,
    @Args('first', { type: () => Int, defaultValue: 20 }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<FavoritesConnection> {
    const maxFirst = 50;
    const safeFirst = Math.min(Math.max(first, 1), maxFirst);

    const favoriteIds = (user.favorites ?? []).map((id) => id.toString());
    const totalCount = favoriteIds.length;

    const startIndex = after ? decodeCursor(after) + 1 : 0;
    const endExclusive = Math.min(startIndex + safeFirst, totalCount);
    const sliceIds = favoriteIds.slice(startIndex, endExclusive);

    const activities = sliceIds.length
      ? await this.activityModel.find({ _id: { $in: sliceIds } }).exec()
      : [];

    const activityById = new Map(
      activities.map((a) => [a._id.toString(), a] as const),
    );

    const edges: FavoriteEdge[] = [];
    for (let i = 0; i < sliceIds.length; i += 1) {
      const id = sliceIds[i];
      const node = activityById.get(id);
      if (!node) continue;
      edges.push({ cursor: encodeCursor(startIndex + i), node });
    }

    const pageInfo: FavoritesPageInfo = {
      endCursor: edges.length ? edges[edges.length - 1].cursor : null,
      hasNextPage: endExclusive < totalCount,
    };

    return {
      edges,
      pageInfo,
      totalCount,
    };
  }
}
