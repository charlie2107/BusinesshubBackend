import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // ---------------- CREATE BUSINESS ----------------
async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
  // Find category by name or slug
  const category = await this.categoryModel.findOne({
    $or: [
      { name: createBusinessDto.category },
      { slug: createBusinessDto.category },
    ],
  });

  if (!category) {
    throw new NotFoundException(`Category '${createBusinessDto.category}' not found`);
  }

  // ✅ Save category as ObjectId, not string
  const business = new this.businessModel({
    ...createBusinessDto,
    category: category._id,
  });

  return business.save();
}



  // ---------------- GET ALL BUSINESSES ----------------
  async findAll(): Promise<Business[]> {
    return this.businessModel
      .find()
      .populate('category', 'name slug icon') // populate category info
      .lean()
      .exec();
  }

  // ---------------- GET SINGLE BUSINESS ----------------
  async findOne(id: string): Promise<Business> {
    const business = await this.businessModel
      .findById(id)
      .populate('category', 'name slug icon')
      .lean()
      .exec();

    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  // ---------------- UPDATE BUSINESS ----------------
  async update(id: string, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
    let updateData: any = { ...updateBusinessDto };

    // If category is being updated, resolve it again
    if (updateBusinessDto.category) {
      const category = await this.categoryModel.findOne({
        $or: [
          { name: updateBusinessDto.category },
          { slug: updateBusinessDto.category },
        ],
      });

      if (!category) {
        throw new NotFoundException(`Category '${updateBusinessDto.category}' not found`);
      }

      updateData.category = category._id;
    }

    const business = await this.businessModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name slug icon')
      .lean()
      .exec();

    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  // ---------------- DELETE BUSINESS ----------------
  async remove(id: string): Promise<void> {
    const result = await this.businessModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Business not found');
  }

async getByCategoryId(categoryId: string) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new NotFoundException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(categoryId).lean().exec();
    if (!category) throw new NotFoundException('Category not found');

    const businesses = await this.businessModel.find({ category: categoryId }).lean();
    return {
      category,
      businesses,
      count: businesses.length,
    };
  }
}
