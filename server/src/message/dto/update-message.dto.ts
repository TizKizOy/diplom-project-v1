import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-message.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, Min } from 'class-validator';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @ApiProperty({
    description: 'Статус прочтения',
    example: 'true/false',
  })
  @IsOptional()
  @IsBoolean({ message: 'Статус должно быть bool' })
  @Type(() => Boolean)
  isRead?: boolean;
}
