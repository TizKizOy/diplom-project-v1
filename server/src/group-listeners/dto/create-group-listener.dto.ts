import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateGroupListenerDto {
  @ApiProperty({ example: 1, description: 'ID группы' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  groupId: number;

  @ApiProperty({
    example: 5,
    description: 'ID слушателя (пользователь с ролью Слушатель)',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  listenerId: number;
}
