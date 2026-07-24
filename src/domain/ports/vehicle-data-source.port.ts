import { Make } from '../entities/make.entity';
import { VehicleType } from '../entities/vehicle-type.entity';

export const VEHICLE_DATA_SOURCE = Symbol('VEHICLE_DATA_SOURCE');

export interface VehicleDataSource {
  getAllMakes(): Promise<Make[]>;
  getVehicleTypesForMake(makeId: number): Promise<VehicleType[]>;
}
