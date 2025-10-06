// src/modules/business/business.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UploadedFiles, UseInterceptors, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessService } from './business.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // ---------------- CREATE BUSINESS ----------------
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'photos', maxCount: 5 }]))
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
    @UploadedFiles() files: { photos?: Express.Multer.File[] },
  ) {
    const photos = files.photos || [];
    const photoUrls: string[] = [];

    for (const file of photos) {
      const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'business_photos' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
      photoUrls.push(result.secure_url);
    }

    return this.businessService.create({ ...createBusinessDto, photos: photoUrls });
  }

  // ---------------- GET ALL BUSINESSES ----------------
  @Get()
  async findAll() {
    return this.businessService.findAll(); // photos are already URLs
  }

  // ---------------- SEARCH BUSINESSES ----------------
@Get('search')
async search(@Query('q') query: string) {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [];
  }
  return this.businessService.searchBusinesses(query.trim());
}


  // ---------------- BUSINESSES BY CATEGORY ----------------
  @Get('category/:id')
  getByCategoryId(@Param('id') id: string) {
    return this.businessService.getByCategoryId(id);
  }

  // ---------------- GET SINGLE BUSINESS ----------------
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  // ---------------- UPDATE BUSINESS ----------------
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.update(id, updateBusinessDto);
  }

  // ---------------- DELETE BUSINESS ----------------
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessService.remove(id);
  }
}
