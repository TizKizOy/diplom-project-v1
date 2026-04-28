import { PartialType } from '@nestjs/swagger';
import { CreateTestOptionDto } from './create-test-option.dto';

export class UpdateTestOptionDto extends PartialType(CreateTestOptionDto) {}
