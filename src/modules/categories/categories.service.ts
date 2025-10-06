import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { Business, BusinessDocument } from '../business/schemas/business.schema';
import { CategoryDocument } from './schemas/category.schema'; 
@Injectable()
export class CategoriesService {
   constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>, // ✅ added this line
  ) {}

  async create(data: { name: string; description?: string }) {
    const category = new this.categoryModel(data);
    return category.save();
  }

async findAll() {
  const categories = await this.categoryModel.find().lean();

  // Count businesses for each category
  const counts = await this.businessModel.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = counts.reduce((acc, cur) => {
    acc[cur._id?.toString()] = cur.count;
    return acc;
  }, {});

  return categories.map((cat) => ({
    ...cat,
    count: countMap[cat._id.toString()] || 0,
  }));
}

  async findOne(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const updated = await this.categoryModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async delete(id: string) {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Category not found');
    return { message: 'Category deleted successfully' };
  }
}
