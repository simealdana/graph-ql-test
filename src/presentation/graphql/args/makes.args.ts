import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

@ArgsType()
export class MakesArgs {
  @Field(() => Int, { defaultValue: 50, description: 'Max items to return (1-200)' })
  @Min(1)
  @Max(200)
  limit!: number;

  @Field(() => Int, { defaultValue: 0, description: 'Items to skip' })
  @Min(0)
  offset!: number;

  @Field(() => String, { nullable: true, description: 'Case-insensitive filter on make name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
