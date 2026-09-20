import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema, Types } from 'mongoose';

export type RoomParticipantDocument = HydratedDocument<RoomParticipant>;

export enum ParticipantStatus {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT',
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
export class RoomParticipant {
  @Prop({
    type: MSchema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  })
  roomId: Types.ObjectId;

  @Prop({
    type: MSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop({ type: Date, default: null })
  leftAt?: Date;

  @Prop({
    type: String,
    enum: ParticipantStatus,
    default: ParticipantStatus.ACTIVE,
    index: true,
  })
  status: ParticipantStatus;
}

export const RoomParticipantSchema =
  SchemaFactory.createForClass(RoomParticipant);

// Indexes for active participant lookups and duplicate prevention
RoomParticipantSchema.index({ roomId: 1, userId: 1, status: 1 });
RoomParticipantSchema.index({ roomId: 1, status: 1 });

