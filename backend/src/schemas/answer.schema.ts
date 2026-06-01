import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Answer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true }) questionId: Types.ObjectId;
  @Prop({ required: true }) content: string;
  @Prop({ required: true }) contributorName: string;
  @Prop({ default: false }) isVerified: boolean;
  createdAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);