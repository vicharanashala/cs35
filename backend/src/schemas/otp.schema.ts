import { Prop, Schema, SchemaFactory } from '@nestjs/common';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Otp extends Document {
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) otp: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: false }) verified: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
