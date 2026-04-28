import { IsString, MinLength, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Текс в сообщение',
    example: 'Любой текст',
    minLength: 5,
    maxLength: 2000,
  })
  @IsString({ message: 'Необходимо передать Текс сообщения' })
  @MinLength(3, { message: 'Текс минимум 5 символа' })
  @MaxLength(2000, { message: 'Текс максимум 2000 символов' })
  message: string;

  @ApiProperty({
    description: 'ID отправителя',
    example: 3,
    minimum: 1,
  })
  @IsInt({ message: 'ID отправителя должно быть числом' })
  @Min(1, { message: 'ID отправителя ≥ 1' })
  @Type(() => Number)
  senderId: number;

  @ApiProperty({
    description: 'ID получателя',
    example: 3,
    minimum: 1,
  })
  @IsInt({ message: 'ID получателя должно быть числом' })
  @Min(1, { message: 'ID получателя ≥ 1' })
  @Type(() => Number)
  receiverId: number;
}
