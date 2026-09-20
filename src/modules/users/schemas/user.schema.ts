import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false, default: null, trim: true })
  profileImage?: string;

  @Prop({ required: true, default: false })
  isOnline: boolean;

  // Timestamps provided automatically by { timestamps: true }
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Exclude password and __v on toJSON and toObject transformations
const transformFn = (_doc: any, ret: Record<string, any>) => {
  delete ret.password;
  delete ret.__v;
  return ret;
};

UserSchema.set('toJSON', {
  virtuals: true,
  transform: transformFn,
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: transformFn,
});

