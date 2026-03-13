import DataLoader = require('dataloader');

import { User } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';

export type UserByIdLoader = DataLoader<string, User | null>;

export function createUserByIdLoader(
  userService: Pick<UserService, 'findManyByIds'>,
): UserByIdLoader {
  return new DataLoader<string, User | null>(async (ids) => {
    const uniqueIds = Array.from(new Set(ids));
    const users = uniqueIds.length ? await userService.findManyByIds(uniqueIds) : [];
    const userById = new Map(users.map((u) => [u._id.toString(), u] as const));

    return ids.map((id) => userById.get(id) ?? null);
  });
}
