import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type FaqCategory = 'NOC' | 'Offer Letter' | 'ViBe' | 'Samagama' | 'Stipend' | 'General';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Faq extends Document {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop({ enum: ['NOC', 'Offer Letter', 'ViBe', 'Samagama', 'Stipend', 'General'], required: true }) category: FaqCategory;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ default: 0 }) views: number;
  @Prop({ default: false }) isAnswered: boolean;
  @Prop({ default: 0 }) upvotes: number;
  createdAt: Date;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);