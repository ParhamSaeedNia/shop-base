import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from '../entities/product.model';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [SequelizeModule.forFeature([Product]), MetricsModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductsModule {}
