import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Field, HideField, ID, ObjectType } from '@nestjs/graphql';
import { Activity } from '../activity/activity.schema';

@ObjectType()
@Schema({ timestamps: true })
export class User extends Document {
  @Field(() => ID)
  id!: string;

  @Prop({ required: true, enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';

  @Field()
  @Prop({ required: true })
  firstName!: string;

  @Field()
  @Prop({ required: true })
  lastName!: string;

  @Field()
  @Prop({ required: true, unique: true })
  email!: string;

  @Field()
  @HideField()
  @Prop({ required: true })
  password!: string;

  @Prop()
  token?: string;

  @Field(() => [Activity])
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }] })
  favorites!: Activity[];
}

export const UserSchema = SchemaFactory.createForClass(User);
