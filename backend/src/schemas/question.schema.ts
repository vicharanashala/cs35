import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Question extends Document {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) category: string;
  @Prop() details: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop() screenshotUrl: string;
  @Prop({ enum: ['open', 'answered', 'reopened', 'closed'], default: 'open' }) status: 'open' | 'answered' | 'reopened' | 'closed';
  @Prop({ enum: ['Low', 'Medium', 'High'], default: 'Medium' }) priority: 'Low' | 'Medium' | 'High';
  @Prop({ default: false }) isClosed: boolean;
  @Prop() contributorName: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) contributorId: Types.ObjectId;
  createdAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
