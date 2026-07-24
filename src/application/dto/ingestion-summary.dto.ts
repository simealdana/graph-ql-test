export interface IngestionFailure {
  makeId: number;
  makeName: string;
  reason: string;
}

export interface IngestionSummary {
  totalMakesDiscovered: number;
  makesProcessed: number;
  makesSucceeded: number;
  makesFailed: number;
  vehicleTypesLinked: number;
  durationMs: number;
  failures: IngestionFailure[];
}
