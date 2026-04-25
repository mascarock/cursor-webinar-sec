import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty() name!: string;
}
