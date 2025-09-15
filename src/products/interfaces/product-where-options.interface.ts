import { Op } from 'sequelize';

export interface ProductWhereOptions {
  category?: string;
  brand?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  price?: {
    [Op.gte]?: number;
    [Op.lte]?: number;
  };
  [Op.or]?: Array<{
    name?: { [Op.iLike]: string };
    description?: { [Op.iLike]: string };
    brand?: { [Op.iLike]: string };
  }>;
}
