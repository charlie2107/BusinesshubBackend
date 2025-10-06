import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  icon?: string;

  @Prop()
  count?: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description?: string;
}

// ✅ Define and export the document type
export type CategoryDocument = Category & Document;

export const CategorySchema = SchemaFactory.createForClass(Category);
