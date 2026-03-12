import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Activity } from 'src/activity/activity.schema';

@ObjectType()
export class FavoritesPageInfo {
  @Field(() => String, { nullable: true })
  endCursor?: string | null;

  @Field()
  hasNextPage!: boolean;
}

@ObjectType()
export class FavoriteEdge {
  @Field()
  cursor!: string;

  @Field(() => Activity)
  node!: Activity;
}

@ObjectType()
export class FavoritesConnection {
  @Field(() => [FavoriteEdge])
  edges!: FavoriteEdge[];

  @Field(() => FavoritesPageInfo)
  pageInfo!: FavoritesPageInfo;

  @Field(() => Int)
  totalCount!: number;
}
