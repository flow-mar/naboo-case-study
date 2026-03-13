import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SignUpInput } from 'src/auth/types';
import { User } from './user.schema';
import * as bcrypt from 'bcrypt';

const MAX_FAVORITES = 50;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async findManyByIds(ids: readonly string[]): Promise<User[]> {
    if (!ids.length) return [];
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }

  async getByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email: email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email }).exec();
  }

  async getById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(
    data: SignUpInput & {
      role?: User['role'];
    },
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({ ...data, password: hashedPassword });
    return user.save();
  }

  async updateToken(id: string, token: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.token = token;
    return user.save();
  }

  async countDocuments(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async addFavorite(userId: string, activityId: string): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          $or: [
            // Idempotent: allow if already favorited, even if at the limit.
            { favorites: activityId },
            // Allow adding only if we're still under the limit.
            {
              $expr: {
                $lt: [{ $size: '$favorites' }, MAX_FAVORITES],
              },
            },
          ],
        },
        { $addToSet: { favorites: activityId } },
        { new: true },
      )
      .exec();

    if (!user) {
      // Either the user doesn't exist, or the favorites limit was reached.
      const exists = await this.userModel.exists({ _id: userId });
      if (!exists) {
        throw new NotFoundException('User not found');
      }
      throw new BadRequestException('Favorites limit reached');
    }

    return user;
  }

  async removeFavorite(userId: string, activityId: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { favorites: activityId } },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async reorderFavorites(userId: string, ids: string[]): Promise<User> {
    if (ids.length > MAX_FAVORITES) {
      throw new BadRequestException('Favorites limit reached');
    }
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { favorites: ids },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async setDebugMode({
    userId,
    enabled,
  }: {
    userId: string;
    enabled: boolean;
  }): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        debugModeEnabled: enabled,
      },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
