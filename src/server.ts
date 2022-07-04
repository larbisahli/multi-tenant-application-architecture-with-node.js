import express, { Application, Request, Response, NextFunction } from 'express';
import PostgresClient from './database/index';
import { ProductType } from './interfaces/index';

const app: Application = express();

app.set('trust proxy', true);

app.disable('x-powered-by');

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
    const tenant_name = req.hostname; //subdomains[0]
    const { product_id } = req.body;

    console.log('=======>', { tenant_name, product_id });

    const client = await this.transaction(tenant_name);

    try {
      // **** TRANSACTION ****
      await client.query('BEGIN');

      // Check the tenant
      const tenant = client.tenant;
      console.log('tenant :>>', { tenant });

      if (!tenant?.id || tenant?.status !== 'active') {
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

// let's say each client who creates a store (mystore) we gave them a subdomain name (mystore.company.com) to request for data,
// by using req.subdomains we can get the subdomain mystore as the tenant name.
// Here we don't need to do select where id and tenant_id, just product id is enough since we are using RLS

const PORT = 5000;

const server = app.listen(PORT, function () {
  console.log(`Express Server started on port ${PORT}`);
});

export default server;
