import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A vehicle type (e.g. Passenger Car, Truck) associated with a make' })
export class VehicleTypeModel {
  @Field(() => Int, { description: 'NHTSA vehicle type identifier' })
  typeId!: number;

  @Field(() => String, { description: 'Human-readable vehicle type name' })
  typeName!: string;
}
