import { VehicleType } from './vehicle-type.entity';

export interface Make {
  makeId: number;
  makeName: string;
}

export interface MakeWithVehicleTypes extends Make {
  vehicleTypes: VehicleType[];
}
