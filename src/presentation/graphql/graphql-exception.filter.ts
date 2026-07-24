import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { DomainError } from '../../domain/errors/domain.errors';

@Catch()
export class GraphqlExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GraphqlExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): unknown {
    if (host.getType<GqlContextType>() !== 'graphql') {
      throw exception;
    }

    if (exception instanceof DomainError) {
      this.logger.warn({ msg: 'Domain error surfaced to GraphQL', code: exception.code });
      return new GraphQLError(exception.message, {
        extensions: { code: exception.code },
      });
    }

    if (exception instanceof GraphQLError) {
      return exception;
    }

    this.logger.error({
      msg: 'Unexpected exception',
      error: exception instanceof Error ? exception.stack : String(exception),
    });
    return new GraphQLError('Internal server error', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}
