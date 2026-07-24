import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { LoggerModule } from 'nestjs-pino';
import { ApplicationModule } from './application/application.module';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/app-config.service';
import { PresentationModule } from './presentation/presentation.module';
import { IngestionScheduler } from './presentation/scheduler/ingestion.scheduler';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          autoLogging: config.env !== 'test',
          transport:
            config.env === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          redact: ['req.headers.authorization'],
        },
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        autoSchemaFile: config.env === 'production' ? true : join(process.cwd(), 'schema.gql'),
        sortSchema: true,
        playground: false,
        graphiql: config.env !== 'production',
        introspection: true,
      }),
    }),
    ScheduleModule.forRoot(),
    ApplicationModule,
    PresentationModule,
  ],
  providers: [IngestionScheduler],
})
export class AppModule {}
