import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'products',
})
export class Product extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare stock: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare sku: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare category: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare brand: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare images: string[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare specifications: Record<string, any>;

  @Column({
    type: DataType.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0,
  })
  declare rating: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare reviewCount: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isFeatured: boolean;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare salePrice: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare saleStartDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare saleEndDate: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare weight: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare dimensions: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare color: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare size: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare viewCount: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare soldCount: number;
}
