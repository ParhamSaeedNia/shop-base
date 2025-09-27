import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    example: 'iPhone 15 Pro',
    description: 'Product name',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Latest iPhone with advanced camera system',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 999.99,
    description: 'Product price',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Stock quantity',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: 'IPH15PRO-128-BLK',
    description: 'Product SKU',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    example: 'Electronics',
    description: 'Product category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'Apple',
    description: 'Product brand',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Product images URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    example: { color: 'Space Black', storage: '128GB', screen: '6.1 inch' },
    description: 'Product specifications',
  })
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Product rating (0-5)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is product active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Is product featured',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: 899.99,
    description: 'Sale price',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'Sale start date',
  })
  @IsOptional()
  @IsDateString()
  saleStartDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Sale end date',
  })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  @ApiPropertyOptional({
    example: '187g',
    description: 'Product weight',
  })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional({
    example: '147.5 x 71.5 x 8.25 mm',
    description: 'Product dimensions',
  })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiPropertyOptional({
    example: 'Space Black',
    description: 'Product color',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    example: '128GB',
    description: 'Product size',
  })
  @IsOptional()
  @IsString()
  size?: string;
}
