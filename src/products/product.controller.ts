import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/request/create-product.dto';
import { UpdateProductDto } from './dto/request/update-product.dto';
import { GetProductsDto } from './dto/request/get-products.dto';
import { ProductResponseDto } from './dto/response/product-response.dto';
import { ProductsListResponseDto } from './dto/response/products-list-response.dto';
import { CategoriesResponseDto } from './dto/response/categories-response.dto';
import { DeleteProductResponseDto } from './dto/response/delete-product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  //---------------------------------------------
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }
  //---------------------------------------------
  @Get()
  @ApiOperation({
    summary: 'Get all products with filters and pagination',
    description:
      'Retrieve a paginated list of products with optional filtering and sorting options',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductsListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  findAll(@Query() query: GetProductsDto) {
    return this.productService.findAll(
      query.page,
      query.limit,
      query.search,
      query.category,
      query.brand,
      query.minPrice,
      query.maxPrice,
      query.isActive,
      query.isFeatured,
      query.sortBy,
      query.sortOrder,
    );
  }
  //---------------------------------------------
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
    type: [ProductResponseDto],
  })
  getFeaturedProducts(
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return this.productService.getFeaturedProducts(limit);
  }
  //---------------------------------------------
  @Get('top-rated')
  @ApiOperation({ summary: 'Get top-rated products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Top-rated products retrieved successfully',
    type: [ProductResponseDto],
  })
  getTopRatedProducts(
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return this.productService.getTopRatedProducts(limit);
  }
  //---------------------------------------------
  @Get('best-selling')
  @ApiOperation({ summary: 'Get best-selling products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Best-selling products retrieved successfully',
    type: [ProductResponseDto],
  })
  getBestSellingProducts(
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return this.productService.getBestSellingProducts(limit);
  }
  //---------------------------------------------
  @Get('categories')
  @ApiOperation({
    summary: 'Get all product categories',
    description: 'Retrieve a list of all available product categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: CategoriesResponseDto,
  })
  getCategories() {
    return this.productService.getCategories();
  }
  //---------------------------------------------
  @Get('brands')
  @ApiOperation({ summary: 'Get all product brands' })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  getBrands() {
    return this.productService.getBrands();
  }
  //---------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }
  //---------------------------------------------
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }
  //---------------------------------------------
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete product (Admin only)',
    description: 'Permanently delete a product from the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    type: DeleteProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }
  //---------------------------------------------
  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product stock (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.productService.updateStock(id, quantity);
  }
  //---------------------------------------------
}
