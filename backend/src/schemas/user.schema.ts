import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class User extends Document {
  @Prop({ unique: true, sparse: true }) username: string;
  @Prop({ unique: true, sparse: true }) email?: string;
  @Prop({ required: true }) password: string;
  @Prop({ required: true, enum: ['student', 'admin'] }) role:
    | 'student'
    | 'admin';
  @Prop({ default: true }) isActive: boolean;
  @Prop({ default: 0 }) reputation: number;
  @Prop() name: string;
  @Prop({ unique: true, sparse: true }) studentId: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] })
  questionsAsked: Types.ObjectId[];
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] })
  questionsAnswered: Types.ObjectId[];
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] })
  questionsBookmarked: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  following: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
