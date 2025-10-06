import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { Business, BusinessSchema } from './schemas/business.schema';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryConfig } from './cloudinary.config';
import { CategoriesModule } from '../categories/categories.module'; // 👈 correct import

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]), // ✅ only schemas here
    CategoriesModule, // ✅ import the module here, not inside forFeature()
  ],
  controllers: [BusinessController],
  providers: [BusinessService, CloudinaryConfig],
})
export class BusinessModule {}
