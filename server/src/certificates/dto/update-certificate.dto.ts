import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCertificateDto {
  @ApiProperty({
    description: 'URL PDF файла сертификата (единственное редактируемое поле)',
    example: 'https://example.com/certs/cert_123_v2.pdf',
  })
  @IsString({ message: 'PDF URL должен быть строкой' })
  @IsUrl({}, { message: 'Некорректный URL' })
  pdfUrl: string;
}
