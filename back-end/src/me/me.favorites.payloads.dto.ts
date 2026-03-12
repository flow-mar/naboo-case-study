import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AddFavoritePayload {
  @Field(() => ID)
  activityId!: string;

  @Field()
  isFavorite!: true;

  @Field(() => Int)
  favoritesCount!: number;
}

@ObjectType()
export class RemoveFavoritePayload {
  @Field(() => ID)
  activityId!: string;

  @Field()
  isFavorite!: false;

  @Field(() => Int)
  favoritesCount!: number;
}

@ObjectType()
export class ReorderFavoritesPayload {
  @Field(() => [ID])
  ids!: string[];

  @Field(() => Int)
  favoritesCount!: number;
}
