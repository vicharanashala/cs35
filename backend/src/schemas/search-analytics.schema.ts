import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SearchAnalytics extends Document {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  query: string;

  @Prop({ default: 1 })
  count: number;

  @Prop({ default: false, index: true })
  failed: boolean;

  @Prop({ default: Date.now })
  lastSearchedAt: Date;
}

export const SearchAnalyticsSchema =
  SchemaFactory.createForClass(SearchAnalytics);
