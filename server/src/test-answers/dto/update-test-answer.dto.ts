import { PartialType } from '@nestjs/mapped-types';
import { CreateTestAnswerDto } from './create-test-answer.dto';

export class UpdateTestAnswerDto extends PartialType(CreateTestAnswerDto) {}
