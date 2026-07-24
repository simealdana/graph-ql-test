import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A make that failed during ingestion and the reason' })
export class IngestionFailureModel {
  @Field(() => Int)
  makeId!: number;

  @Field(() => String)
  makeName!: string;

  @Field(() => String)
  reason!: string;
}

@ObjectType({ description: 'Summary of an ingestion run' })
export class IngestionResultModel {
  @Field(() => Int, { description: 'Total makes returned by the NHTSA API' })
  totalMakesDiscovered!: number;

  @Field(() => Int, { description: 'Makes actually processed (after INGESTION_MAKE_LIMIT)' })
  makesProcessed!: number;

  @Field(() => Int)
  makesSucceeded!: number;

  @Field(() => Int)
  makesFailed!: number;

  @Field(() => Int, { description: 'Total make-to-vehicle-type links persisted' })
  vehicleTypesLinked!: number;

  @Field(() => Int, { description: 'Total ingestion duration in milliseconds' })
  durationMs!: number;

  @Field(() => [IngestionFailureModel])
  failures!: IngestionFailureModel[];
}
