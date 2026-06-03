import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class Voter {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) direction: number; // 1 = up, -1 = down
}
export const VoterSchema = SchemaFactory.createForClass(Voter);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Answer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true }) questionId: Types.ObjectId;
  @Prop({ required: true }) content: string;
  @Prop({ required: true }) contributorName: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) contributorId: Types.ObjectId;
  @Prop({ default: false }) isVerified: boolean;
  @Prop({ default: false }) isAccepted: boolean;
  @Prop({ default: 0 }) upvotes: number;
  @Prop({ default: 0 }) downvotes: number;
  @Prop({ type: [VoterSchema], default: [] }) voters: Voter[];
  @Prop() pendingCategory: string;
  createdAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);