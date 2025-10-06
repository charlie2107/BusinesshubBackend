import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { AddReviewDto } from './dto/add-review.dto';

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

// Fetch category and its businesses
async getByCategoryId(categoryId: string) {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundException('Invalid category ID');
  }

  const category = await this.categoryModel.findById(categoryId).lean().exec();
  if (!category) throw new NotFoundException('Category not found');

const objectId = new Types.ObjectId(categoryId);
const businesses = await this.businessModel
  .find({ category: objectId })
  .populate('category', 'name slug icon')
  .lean()
  .exec();
  return {
    category,      // category object
    businesses,    // businesses with populated category field
    count: businesses.length,
  };
}

async searchBusinesses(query: string): Promise<Business[]> {
  const regex = new RegExp(query, 'i');
  return this.businessModel.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    { $unwind: '$categoryDetails' },
    {
      $match: {
        $or: [
          { name: { $regex: regex } },
          { description: { $regex: regex } },
          { address: { $regex: regex } },
          { email: { $regex: regex } },
          { phone: { $regex: regex } },
          { 'categoryDetails.name': { $regex: regex } },
          { 'categoryDetails.slug': { $regex: regex } },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        address: 1,
        email: 1,
        phone: 1,
        website: 1,
        photos: 1,
        category: '$categoryDetails',
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]).exec();
}

async addReview(businessId: string, addReviewDto: AddReviewDto) {
  const business = await this.businessModel.findById(businessId);
  if (!business) throw new NotFoundException('Business not found');

  // Check if user already reviewed
  const existingReview = business.reviews.find(
    (r) => r.user.toString() === addReviewDto.userId,
  );
  if (existingReview) {
    throw new BadRequestException('User has already reviewed this business');
  }

  // Add new review with createdAt
  business.reviews.push({
    user: new Types.ObjectId(addReviewDto.userId),
    rating: addReviewDto.rating,
    comment: addReviewDto.comment,
    createdAt: new Date(),  // ✅ Add this
  });

  await business.save();
  return business;
}

  async getReviews(businessId: string) {
    const business = await this.businessModel
      .findById(businessId)
      .populate('reviews.user', 'name email') // optional: populate user info
      .exec();

    if (!business) throw new NotFoundException('Business not found');

    return business.reviews;
  }


}
