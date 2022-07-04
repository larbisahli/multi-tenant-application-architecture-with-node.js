import type { Application, Request, Response, NextFunction } from 'express';
import type { ProductType } from './interfaces';
import express from 'express';
import PostgresClient from './database';

const app: Application = express();

app.set('trust proxy', true); // populate req.ip
// you can also name the proxy servers ips for increased security:
//  app.set("trust proxy", "127.0.0.1");
//  app.set("trust proxy", "192.168.3.3");

app.use(express.json());

class Tenant extends PostgresClient {
  constructor() {
    super();
  }

  public getProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const subdomains = req.subdomains;
    const tenant_name = subdomains[0];
    const { product_id } = req.body;

    const client = await this.transaction(tenant_name);

    try {
      // **** TRANSACTION ****
      await client.query('BEGIN');

      // Check the tenant
      const current_tenant = client.tenant;

      if (!current_tenant?.id || current_tenant?.status !== 'active') {
        await client.query('ROLLBACK');
        return res.json({ error: { message: 'Permission denied!' } });
      }

      const { rows } = await client.query<
        ProductType,
        ProductType[keyof ProductType][]
      >(
        `SELECT id, product_name, sale_price::INTEGER, compare_price::INTEGER, quantity, 
        product_description FROM products WHERE id = $1 AND published IS TRUE`,
        [product_id]
      );

      await client.query('COMMIT');
      return res.json({ product: rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  };
}

const resolvers = new Tenant();
app.post('/product', resolvers.getProduct);

const PORT = 5000;
app.listen(PORT, function () {
  console.log(`Express Server started on port ${PORT}`);
});
