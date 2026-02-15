import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier for the category',
  })
  id: string;

  @ApiProperty({
    example: 'Electronics',
    description: 'Name of the category',
  })
  name: string;

  @ApiProperty({
    example:
      'Devices and gadgets including smartphones, laptops, and accessories',
    description: 'A brief description of the category',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    example: 'electronics',
    description: 'URL-friendly identifier for the category (optional)',
    nullable: true,
  })
  slug: string | null;

  @ApiProperty({
    example: 'https://example.com/images/electronics.jpg',
    description: 'URL of the category image (optional)',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: 150,
    description: 'Number of products associated with this category',
  })
  productCount: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Timestamp when the category was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-02T00:00:00.000Z',
    description: 'Timestamp when the category was last updated',
  })
  updatedAt: Date;
}
