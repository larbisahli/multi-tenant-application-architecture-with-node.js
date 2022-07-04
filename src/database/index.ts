import { Pool, PoolClient } from 'pg';
import type { TenantType } from '../interfaces/index';
import dotenv from 'dotenv';

dotenv.config();

const {
  POSTGRES_CRUD_USER,
  POSTGRES_CRUD_USER_PASSWORD,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_DB,
  NODE_ENV,
} = process.env;

const DEV_NODE_ENV = NODE_ENV !== 'production';

const CRUDPool = new Pool({
  host: DEV_NODE_ENV ? '127.0.0.1' : POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  user: POSTGRES_CRUD_USER,
  password: POSTGRES_CRUD_USER_PASSWORD,
  database: POSTGRES_DB,
  max: 15,
});

export default class PostgresClient {
  constructor() {}

  public transaction = async (
    store_name: string | null
  ): Promise<PoolClient> => {
    const client: PoolClient = await CRUDPool.connect();

    // Set tenant name session
    await client.query(
      `SELECT set_config('app.current_tenant_name', $1, FALSE)`,
      [store_name]
    );

    // Get the current tenant information
    const { rows: tenantRow } = await client.query<
      TenantType,
      (string | null)[]
    >(
      'SELECT id, store_name, fullname, email, status FROM tenants WHERE store_name = $1',
      [store_name]
    );

    // // ---------- REST ------------
    // const { rows: current_tenant_name } = await client.query(
    //   `SELECT current_setting('app.current_tenant_name');`,
    //   []
    // );

    // console.log('Transaction.current_tenant ==>', {tenantRow, current_tenant_name});
    // // ----------------------------

    if (tenantRow?.length > 0) {
      const current_tenant = tenantRow[0];
      client.tenant = current_tenant;

      // Set tenant id session
      const tenant_id = current_tenant.id;
      await client.query(
        `SELECT set_config('app.current_tenant_id', $1, FALSE)`,
        [tenant_id]
      );
    }

    const query = client.query;
    const release = client.release;

    client.release = async () => {
      // Resetting the session's state
      await client.query('DISCARD ALL', []);
      client.tenant = null;

      // set the methods back to their old un-monkey-patched version
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    return client;
  };
}
