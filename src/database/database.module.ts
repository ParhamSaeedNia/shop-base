import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.model';
import { RefreshToken } from '../entities/refresh-token.model';
import { Product } from '../entities/product.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<string>('DB_PORT');
        const dbUsername = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        const dbName = configService.get<string>('DB_NAME');

        if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
          throw new Error(
            'Database environment variables are not properly configured',
          );
        }

        return {
          dialect: 'postgres' as const,
          host: dbHost,
          port: parseInt(dbPort, 10),
          username: dbUsername,
          password: dbPassword,
          database: dbName,
          models: [User, RefreshToken, Product],
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
