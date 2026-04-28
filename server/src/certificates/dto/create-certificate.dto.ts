import { IsString, IsInt, IsOptional, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateDto {
  @ApiProperty({
    description: 'ID слушателя (должен иметь роль Слушатель)',
    example: 5,
  })
  @IsInt({ message: 'ID слушателя должно быть числом' })
  @Type(() => Number)
  listenerId: number;

  @ApiProperty({
    description: 'ID курса (может быть даже удалённым — для истории)',
    example: 2,
  })
  @IsInt({ message: 'ID курса должно быть числом' })
  @Type(() => Number)
  courseId: number;

  @ApiProperty({
    description: 'ID шаблона сертификата',
    example: 2,
  })
  @IsInt({ message: 'ID шаблона должно быть числом' })
  @Type(() => Number)
  templateId: number;

  @ApiPropertyOptional({
    description: 'URL PDF файла сертификата',
    example: 'https://example.com/certs/cert_123.pdf',
  })
  @IsOptional()
  @IsString({ message: 'PDF URL должен быть строкой' })
  @IsUrl({}, { message: 'Некорректный URL' })
  pdfUrl?: string;
}
