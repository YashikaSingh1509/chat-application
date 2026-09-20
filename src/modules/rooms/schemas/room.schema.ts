import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema, Types } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class Room {
  @Prop({ required: true, trim: true })
  roomName: string;

  @Prop({
    type: MSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  hostId: Types.ObjectId;

  @Prop({
    type: String,
    enum: RoomStatus,
    default: RoomStatus.ACTIVE,
    index: true,
  })
  status: RoomStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  participantCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// Indexes for active room filtering and host queries
RoomSchema.index({ status: 1, createdAt: -1 });
RoomSchema.index({ hostId: 1, status: 1 });

