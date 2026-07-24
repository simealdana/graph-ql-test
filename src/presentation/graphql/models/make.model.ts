import { Field, Int, ObjectType } from '@nestjs/graphql';
import { VehicleTypeModel } from './vehicle-type.model';

@ObjectType({ description: 'A vehicle make with its associated vehicle types' })
export class MakeModel {
  @Field(() => Int, { description: 'NHTSA make identifier' })
  makeId!: number;

  @Field(() => String, { description: 'Human-readable make name' })
  makeName!: string;

  @Field(() => [VehicleTypeModel], { description: 'Vehicle types produced by this make' })
  vehicleTypes!: VehicleTypeModel[];
}

@ObjectType({ description: 'Paginated list of makes' })
export class PaginatedMakesModel {
  @Field(() => [MakeModel])
  items!: MakeModel[];

  @Field(() => Int, { description: 'Total number of makes matching the filter' })
  total!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  offset!: number;
}
