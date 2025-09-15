import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RequestUser } from '../auth/interfaces/request-user.interface';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: jest.Mocked<ProductService>;

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
  };

  const mockRequest = {
    user: {
      sub: 'user-id-123',
      email: 'admin@example.com',
      role: 'admin',
    } as RequestUser,
  };

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
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getCategories: jest.fn(),
            getBrands: jest.fn(),
            getFeaturedProducts: jest.fn(),
            getTopRatedProducts: jest.fn(),
            getBestSellingProducts: jest.fn(),
            updateStock: jest.fn(),
            incrementSoldCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product (admin only)', async () => {
      // Arrange
      productService.create.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.create(mockCreateProductDto);

      // Assert
      expect(productService.create).toHaveBeenCalledWith(mockCreateProductDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products with default parameters', async () => {
      // Arrange
      const mockResult = {
        products: [mockProduct],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      productService.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll(1, 10);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('should return paginated products with custom parameters', async () => {
      // Arrange
      const mockResult = {
        products: [mockProduct],
        total: 1,
        page: 2,
        totalPages: 1,
      };
      productService.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll(
        2,
        5,
        'Electronics',
        'TestBrand',
        '100',
        '500',
        'true',
        'false',
        'test search',
      );

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        2,
        5,
        'Electronics',
        'TestBrand',
        100,
        500,
        true,
        false,
        'test search',
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle boolean parameter conversion correctly', async () => {
      // Arrange
      const mockResult = {
        products: [mockProduct],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      productService.findAll.mockResolvedValue(mockResult);

      // Act
      await controller.findAll(
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        'true',
        'false',
        undefined,
      );

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        false,
        undefined,
      );
    });

    it('should handle numeric parameter conversion correctly', async () => {
      // Arrange
      const mockResult = {
        products: [mockProduct],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      productService.findAll.mockResolvedValue(mockResult);

      // Act
      await controller.findAll(
        1,
        10,
        undefined,
        undefined,
        '100',
        '500',
        undefined,
        undefined,
        undefined,
      );

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        100,
        500,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products with default limit', async () => {
      // Arrange
      productService.getFeaturedProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await controller.getFeaturedProducts(8);

      // Assert
      expect(productService.getFeaturedProducts).toHaveBeenCalledWith(8);
      expect(result).toEqual([mockProduct]);
    });

    it('should return featured products with custom limit', async () => {
      // Arrange
      productService.getFeaturedProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await controller.getFeaturedProducts(5);

      // Assert
      expect(productService.getFeaturedProducts).toHaveBeenCalledWith(5);
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('getTopRatedProducts', () => {
    it('should return top-rated products with default limit', async () => {
      // Arrange
      productService.getTopRatedProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await controller.getTopRatedProducts(8);

      // Assert
      expect(productService.getTopRatedProducts).toHaveBeenCalledWith(8);
      expect(result).toEqual([mockProduct]);
    });

    it('should return top-rated products with custom limit', async () => {
      // Arrange
      productService.getTopRatedProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await controller.getTopRatedProducts(10);

      // Assert
      expect(productService.getTopRatedProducts).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('getBestSellingProducts', () => {
    it('should return best-selling products with default limit', async () => {
      // Arrange
      productService.getBestSellingProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await controller.getBestSellingProducts(8);

      // Assert
      expect(productService.getBestSellingProducts).toHaveBeenCalledWith(8);
      expect(result).toEqual([mockProduct]);
    });

    it('should return best-selling products with custom limit', async () => {
      // Arrange
      productService.getBestSellingProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await controller.getBestSellingProducts(15);

      // Assert
      expect(productService.getBestSellingProducts).toHaveBeenCalledWith(15);
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      // Arrange
      const categories = ['Electronics', 'Clothing', 'Books'];
      productService.getCategories.mockResolvedValue(categories);

      // Act
      const result = await controller.getCategories();

      // Assert
      expect(productService.getCategories).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });
  });

  describe('getBrands', () => {
    it('should return all brands', async () => {
      // Arrange
      const brands = ['Apple', 'Samsung', 'Nike'];
      productService.getBrands.mockResolvedValue(brands);

      // Act
      const result = await controller.getBrands();

      // Assert
      expect(productService.getBrands).toHaveBeenCalled();
      expect(result).toEqual(brands);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      // Arrange
      productService.findOne.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findOne('product-id-123');

      // Assert
      expect(productService.findOne).toHaveBeenCalledWith('product-id-123');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productService.findOne.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      // Act & Assert
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('update', () => {
    it('should update a product (admin only)', async () => {
      // Arrange
      const updatedProduct = { ...mockProduct, ...mockUpdateProductDto };
      productService.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await controller.update(
        'product-id-123',
        mockUpdateProductDto,
      );

      // Assert
      expect(productService.update).toHaveBeenCalledWith(
        'product-id-123',
        mockUpdateProductDto,
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productService.update.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      // Act & Assert
      await expect(
        controller.update('non-existent-id', mockUpdateProductDto),
      ).rejects.toThrow(new NotFoundException('Product not found'));
    });
  });

  describe('remove', () => {
    it('should delete a product (admin only)', async () => {
      // Arrange
      productService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove('product-id-123');

      // Assert
      expect(productService.remove).toHaveBeenCalledWith('product-id-123');
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productService.remove.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      // Act & Assert
      await expect(controller.remove('non-existent-id')).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('updateStock', () => {
    it('should update product stock (admin only)', async () => {
      // Arrange
      const updatedProduct = { ...mockProduct, stock: 75 };
      productService.updateStock.mockResolvedValue(updatedProduct);

      // Act
      const result = await controller.updateStock('product-id-123', 25);

      // Assert
      expect(productService.updateStock).toHaveBeenCalledWith(
        'product-id-123',
        25,
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      productService.updateStock.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      // Act & Assert
      await expect(
        controller.updateStock('non-existent-id', 25),
      ).rejects.toThrow(new NotFoundException('Product not found'));
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      // Arrange
      productService.updateStock.mockRejectedValue(
        new BadRequestException('Insufficient stock'),
      );

      // Act & Assert
      await expect(
        controller.updateStock('product-id-123', -100),
      ).rejects.toThrow(new BadRequestException('Insufficient stock'));
    });
  });
});
