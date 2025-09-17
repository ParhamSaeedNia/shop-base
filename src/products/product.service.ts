import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from '../entities/product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Op, WhereOptions, CreationAttributes } from 'sequelize';
import { ProductWhereOptions } from './interfaces';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
  ) {}
  //---------------------------------------------
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product = await this.productModel.create(
        createProductDto as unknown as CreationAttributes<Product>,
      );
      return product;
    } catch {
      throw new BadRequestException('Failed to create product');
    }
  }
  //---------------------------------------------
  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: string,
    brand?: string,
    minPrice?: number,
    maxPrice?: number,
    isActive?: boolean,
    isFeatured?: boolean,
    search?: string,
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const where: ProductWhereOptions = {};

    // Build where conditions
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price[Op.lte] = maxPrice;
      }
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await this.productModel.findAndCountAll({
      where: where as WhereOptions<Product>,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      products: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }
  //---------------------------------------------
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findByPk(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await product.increment('viewCount');

    return product;
  }
  //---------------------------------------------
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productModel.findByPk(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      await product.update(updateProductDto);
      return product;
    } catch {
      throw new BadRequestException('Failed to update product');
    }
  }
  //---------------------------------------------
  async remove(id: string): Promise<void> {
    const product = await this.productModel.findByPk(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await product.destroy();
  }
  //---------------------------------------------
  async getCategories(): Promise<string[]> {
    const categories = await this.productModel.findAll({
      attributes: ['category'],
      where: {
        category: { [Op.ne]: null },
        isActive: true,
      },
      group: ['category'],
    });

    return categories.map((cat) => cat.category).filter(Boolean);
  }
  //---------------------------------------------
  async getBrands(): Promise<string[]> {
    const brands = await this.productModel.findAll({
      attributes: ['brand'],
      where: {
        brand: { [Op.ne]: null },
        isActive: true,
      },
      group: ['brand'],
    });

    return brands.map((brand) => brand.brand).filter(Boolean);
  }
  //---------------------------------------------
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return this.productModel.findAll({
      where: {
        isFeatured: true,
        isActive: true,
      },
      limit,
      order: [['createdAt', 'DESC']],
    });
  }
  //---------------------------------------------
  async getTopRatedProducts(limit: number = 8): Promise<Product[]> {
    return this.productModel.findAll({
      where: {
        isActive: true,
        rating: { [Op.gte]: 4.0 },
      },
      limit,
      order: [
        ['rating', 'DESC'],
        ['reviewCount', 'DESC'],
      ],
    });
  }
  //---------------------------------------------
  async getBestSellingProducts(limit: number = 8): Promise<Product[]> {
    return this.productModel.findAll({
      where: {
        isActive: true,
      },
      limit,
      order: [['soldCount', 'DESC']],
    });
  }
  //---------------------------------------------
  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.productModel.findByPk(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    await product.update({ stock: newStock });
    return product;
  }
  //---------------------------------------------
  async incrementSoldCount(id: string, quantity: number = 1): Promise<void> {
    const product = await this.productModel.findByPk(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await product.increment('soldCount', { by: quantity });
  }
}
