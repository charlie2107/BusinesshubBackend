import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { Business, BusinessSchema } from '../business/schemas/business.schema'; // 👈 import business schema

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Business.name, schema: BusinessSchema }, // 👈 register BusinessModel
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService,MongooseModule],
})
export class CategoriesModule {}
