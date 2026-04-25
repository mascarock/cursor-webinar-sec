import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ description: 'MemberId of the payer' }) paidBy!: string;
  @ApiProperty() description!: string;
  @ApiProperty() amount!: number;
  @ApiPropertyOptional() currency?: string;
  @ApiPropertyOptional() category?: string;
  @ApiPropertyOptional({ type: [String], description: 'Defaults to all members if omitted' })
  splitBetween?: string[];
}
