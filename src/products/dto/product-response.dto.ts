import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID',
  })
  id: string;

  @ApiProperty({
    example: 'iPhone 15 Pro',
    description: 'Product name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Latest iPhone with advanced camera system',
    description: 'Product description',
  })
  description?: string;

  @ApiProperty({
    example: 999.99,
    description: 'Product price',
  })
  price: number;

  @ApiProperty({
    example: 100,
    description: 'Stock quantity',
  })
  stock: number;

  @ApiPropertyOptional({
    example: 'IPH15PRO-128-BLK',
    description: 'Product SKU',
  })
  sku?: string;

  @ApiPropertyOptional({
    example: 'Electronics',
    description: 'Product category',
  })
  category?: string;

  @ApiPropertyOptional({
    example: 'Apple',
    description: 'Product brand',
  })
  brand?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg'],
    description: 'Product images URLs',
  })
  images?: string[];

  @ApiPropertyOptional({
    example: { color: 'Space Black', storage: '128GB' },
    description: 'Product specifications',
  })
  specifications?: Record<string, any>;

  @ApiProperty({
    example: 4.5,
    description: 'Product rating',
  })
  rating: number;

  @ApiProperty({
    example: 150,
    description: 'Review count',
  })
  reviewCount: number;

  @ApiProperty({
    example: true,
    description: 'Is product active',
  })
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: 'Is product featured',
  })
  isFeatured: boolean;

  @ApiPropertyOptional({
    example: 899.99,
    description: 'Sale price',
  })
  salePrice?: number;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'Sale start date',
  })
  saleStartDate?: Date;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Sale end date',
  })
  saleEndDate?: Date;

  @ApiPropertyOptional({
    example: '187g',
    description: 'Product weight',
  })
  weight?: string;

  @ApiPropertyOptional({
    example: '147.5 x 71.5 x 8.25 mm',
    description: 'Product dimensions',
  })
  dimensions?: string;

  @ApiPropertyOptional({
    example: 'Space Black',
    description: 'Product color',
  })
  color?: string;

  @ApiPropertyOptional({
    example: '128GB',
    description: 'Product size',
  })
  size?: string;

  @ApiProperty({
    example: 1250,
    description: 'View count',
  })
  viewCount: number;

  @ApiProperty({
    example: 45,
    description: 'Sold count',
  })
  soldCount: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Created date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Updated date',
  })
  updatedAt: Date;
}
