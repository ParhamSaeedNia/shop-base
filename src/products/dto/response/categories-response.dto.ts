import { ApiProperty } from '@nestjs/swagger';

export class CategoriesResponseDto {
  @ApiProperty({
    example: ['Electronics', 'Clothing', 'Books', 'Home & Garden'],
    description: 'Array of available product categories',
  })
  categories: string[];
}
