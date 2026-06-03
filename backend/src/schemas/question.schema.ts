import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Question extends Document {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) category: string;
  @Prop() pendingCategory: string;   // student's custom category awaiting admin approval
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop() screenshotUrl: string;
  @Prop({ enum: ['open', 'answered', 'reopened'], default: 'open' }) status: 'open' | 'answered' | 'reopened';
  createdAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);