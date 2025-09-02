import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.model';
import { RefreshToken } from '../entities/refresh-token.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get('DB_HOST');
        const dbPort = configService.get('DB_PORT');
        const dbUsername = configService.get('DB_USERNAME');
        const dbPassword = configService.get('DB_PASSWORD');
        const dbName = configService.get('DB_NAME');

        if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
          throw new Error(
            'Database environment variables are not properly configured',
          );
        }

        return {
          dialect: 'postgres',
          host: dbHost,
          port: parseInt(dbPort.toString()),
          username: dbUsername,
          password: dbPassword,
          database: dbName,
          models: [User, RefreshToken],
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
