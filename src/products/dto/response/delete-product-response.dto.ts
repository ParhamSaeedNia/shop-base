import { ApiProperty } from '@nestjs/swagger';

export class DeleteProductResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the product was successfully deleted',
  })
  success: boolean;

  @ApiProperty({
    example: 'Product deleted successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the deleted product',
  })
  deletedId: string;
}
