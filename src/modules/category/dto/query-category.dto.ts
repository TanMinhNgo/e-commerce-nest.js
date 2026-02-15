import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueryCategoryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination (optional)',
    default: 1,
    minimum: 1,
  })
  @Min(1)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page for pagination (optional)',
    default: 10,
    minimum: 1,
  })
  @Min(1)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit = 10;

  @ApiPropertyOptional({
    example: 'electronics',
    description:
      'Search term to filter categories by name or description (optional)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter categories by active status (optional)',
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
