export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ExternalApiError extends DomainError {
  readonly code = 'EXTERNAL_API_ERROR';

  constructor(
    message: string,
    readonly url?: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export class XmlParseError extends DomainError {
  readonly code = 'XML_PARSE_ERROR';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class TransformationError extends DomainError {
  readonly code = 'TRANSFORMATION_ERROR';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class PersistenceError extends DomainError {
  readonly code = 'PERSISTENCE_ERROR';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class IngestionError extends DomainError {
  readonly code = 'INGESTION_ERROR';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
