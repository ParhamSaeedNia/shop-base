import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from '../entities/product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Op } from 'sequelize';

describe('ProductService', () => {
  let service: ProductService;
  let productModel: jest.Mocked<typeof Product>;

  const mockProduct = {
    id: 'product-id-123',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 50,
    sku: 'TEST-SKU-123',
    category: 'Electronics',
    brand: 'TestBrand',
    images: ['image1.jpg', 'image2.jpg'],
    specifications: { color: 'Black', size: 'Large' },
    rating: 4.5,
    reviewCount: 100,
    isActive: true,
    isFeatured: false,
    salePrice: 89.99,
    saleStartDate: new Date('2024-01-01'),
    saleEndDate: new Date('2024-12-31'),
    weight: '1kg',
    dimensions: '10x10x10cm',
    color: 'Black',
    size: 'Large',
    viewCount: 1000,
    soldCount: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    increment: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  } as any;

  const mockCreateProductDto: CreateProductDto = {
    name: 'New Product',
    description: 'New Description',
    price: 199.99,
    stock: 25,
    sku: 'NEW-SKU-123',
    category: 'Electronics',
    brand: 'NewBrand',
    images: ['new-image.jpg'],
    specifications: { color: 'White' },
    rating: 4.0,
    isActive: true,
    isFeatured: true,
    salePrice: 179.99,
    saleStartDate: '2024-01-01T00:00:00Z',
    saleEndDate: '2024-12-31T23:59:59Z',
    weight: '2kg',
    dimensions: '20x20x20cm',
    color: 'White',
    size: 'Medium',
  };

  const mockUpdateProductDto: UpdateProductDto = {
    name: 'Updated Product',
    price: 299.99,
    stock: 75,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getModelToken(Product),
          useValue: {
            create: jest.fn(),
            findAndCountAll: jest.fn(),
            findByPk: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productModel = module.get(getModelToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      // Arrange
      productModel.create.mockResolvedValue(mockProduct);

      // Act
      const result = await service.create(mockCreateProductDto);

      // Assert
      expect(productModel.create).toHaveBeenCalledWith(mockCreateProductDto);
      expect(result).toEqual(mockProduct);
    });

    it('should throw BadRequestException when creation fails', async () => {
      // Arrange
      productModel.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        new BadRequestException('Failed to create product'),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products with default parameters', async () => {
      // Arrange
      const mockResult = {
        count: 1,
        rows: [mockProduct],
      };
      productModel.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAll();

      // Assert
      expect(productModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual({
        products: [mockProduct],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should return paginated products with custom parameters', async () => {
      // Arrange
      const mockResult = {
        count: 2,
        rows: [mockProduct, { ...mockProduct, id: 'product-id-456' }],
      };
      productModel.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAll(
        2,
        5,
        'Electronics',
        'TestBrand',
        50,
        200,
        true,
        false,
        'test',
      );

      // Assert
      expect(productModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          category: 'Electronics',
          brand: 'TestBrand',
          isActive: true,
          isFeatured: false,
          price: {
            [Op.gte]: 50,
            [Op.lte]: 200,
          },
          [Op.or]: [
            { name: { [Op.iLike]: '%test%' } },
            { description: { [Op.iLike]: '%test%' } },
            { brand: { [Op.iLike]: '%test%' } },
          ],
        },
        limit: 5,
        offset: 5,
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual({
        products: [mockProduct, { ...mockProduct, id: 'product-id-456' }],
        total: 2,
        page: 2,
        totalPages: 1,
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      const mockResult = {
        count: 0,
        rows: [],
      };
      productModel.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual({
        products: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by ID and increment view count', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(mockProduct);
      mockProduct.increment.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne('product-id-123');

      // Assert
      expect(productModel.findByPk).toHaveBeenCalledWith('product-id-123');
      expect(mockProduct.increment).toHaveBeenCalledWith('viewCount');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(mockProduct);
      mockProduct.update.mockResolvedValue({
        ...mockProduct,
        ...mockUpdateProductDto,
      });

      // Act
      const result = await service.update(
        'product-id-123',
        mockUpdateProductDto,
      );

      // Assert
      expect(productModel.findByPk).toHaveBeenCalledWith('product-id-123');
      expect(mockProduct.update).toHaveBeenCalledWith(mockUpdateProductDto);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('non-existent-id', mockUpdateProductDto),
      ).rejects.toThrow(new NotFoundException('Product not found'));
    });

    it('should throw BadRequestException when update fails', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(mockProduct);
      mockProduct.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        service.update('product-id-123', mockUpdateProductDto),
      ).rejects.toThrow(new BadRequestException('Failed to update product'));
    });
  });

  describe('remove', () => {
    it('should delete a product successfully', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(mockProduct);
      mockProduct.destroy.mockResolvedValue(undefined);

      // Act
      await service.remove('product-id-123');

      // Assert
      expect(productModel.findByPk).toHaveBeenCalledWith('product-id-123');
      expect(mockProduct.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      // Arrange
      const mockCategories = [
        { category: 'Electronics' },
        { category: 'Clothing' },
        { category: 'Books' },
      ];
      productModel.findAll.mockResolvedValue(mockCategories as any);

      // Act
      const result = await service.getCategories();

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        attributes: ['category'],
        where: {
          category: { [Op.ne]: null },
          isActive: true,
        },
        group: ['category'],
      });
      expect(result).toEqual(['Electronics', 'Clothing', 'Books']);
    });
  });

  describe('getBrands', () => {
    it('should return unique brands', async () => {
      // Arrange
      const mockBrands = [
        { brand: 'Apple' },
        { brand: 'Samsung' },
        { brand: 'Nike' },
      ];
      productModel.findAll.mockResolvedValue(mockBrands as any);

      // Act
      const result = await service.getBrands();

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        attributes: ['brand'],
        where: {
          brand: { [Op.ne]: null },
          isActive: true,
        },
        group: ['brand'],
      });
      expect(result).toEqual(['Apple', 'Samsung', 'Nike']);
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      // Arrange
      const featuredProducts = [
        mockProduct,
        { ...mockProduct, id: 'featured-2' },
      ];
      productModel.findAll.mockResolvedValue(featuredProducts as any);

      // Act
      const result = await service.getFeaturedProducts(5);

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {
          isFeatured: true,
          isActive: true,
        },
        limit: 5,
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual(featuredProducts);
    });
  });

  describe('getTopRatedProducts', () => {
    it('should return top-rated products', async () => {
      // Arrange
      const topRatedProducts = [
        mockProduct,
        { ...mockProduct, id: 'top-rated-2' },
      ];
      productModel.findAll.mockResolvedValue(topRatedProducts as any);

      // Act
      const result = await service.getTopRatedProducts(5);

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          rating: { [Op.gte]: 4.0 },
        },
        limit: 5,
        order: [
          ['rating', 'DESC'],
          ['reviewCount', 'DESC'],
        ],
      });
      expect(result).toEqual(topRatedProducts);
    });
  });

  describe('getBestSellingProducts', () => {
    it('should return best-selling products', async () => {
      // Arrange
      const bestSellingProducts = [
        mockProduct,
        { ...mockProduct, id: 'best-selling-2' },
      ];
      productModel.findAll.mockResolvedValue(bestSellingProducts as any);

      // Act
      const result = await service.getBestSellingProducts(5);

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        limit: 5,
        order: [['soldCount', 'DESC']],
      });
      expect(result).toEqual(bestSellingProducts);
    });
  });

  describe('updateStock', () => {
    it('should update stock successfully', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(mockProduct);
      mockProduct.update.mockResolvedValue({ ...mockProduct, stock: 75 });

      // Act
      const result = await service.updateStock('product-id-123', 25);

      // Assert
      expect(productModel.findByPk).toHaveBeenCalledWith('product-id-123');
      expect(mockProduct.update).toHaveBeenCalledWith({ stock: 75 });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStock('non-existent-id', 25)).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(mockProduct);

      // Act & Assert
      await expect(service.updateStock('product-id-123', -100)).rejects.toThrow(
        new BadRequestException('Insufficient stock'),
      );
    });
  });

  describe('incrementSoldCount', () => {
    it('should increment sold count successfully', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(mockProduct);
      mockProduct.increment.mockResolvedValue(mockProduct);

      // Act
      await service.incrementSoldCount('product-id-123', 5);

      // Assert
      expect(productModel.findByPk).toHaveBeenCalledWith('product-id-123');
      expect(mockProduct.increment).toHaveBeenCalledWith('soldCount', {
        by: 5,
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.incrementSoldCount('non-existent-id', 5),
      ).rejects.toThrow(new NotFoundException('Product not found'));
    });
  });
});
