import { PoolClient, QueryResult } from 'pg';
import {
  CRUDPool,
} from './pool';
import type { TenantType } from '../interfaces/index';

declare module 'pg' {
  export interface PoolClient {
    tenant?: TenantType | null;
  }
}

interface TenantTransactionProps {
  tenant_name: string | null;
}

export default class PostgresClient {
  
  constructor() {}

  public transaction = async ({
    tenant_name,
  }: TenantTransactionProps): Promise<PoolClient> => {
    
    const client: PoolClient = await CRUDPool.connect();

    // Set tenant session
    await client.query(
      `SELECT set_config('app.current_tenant_name', $1, FALSE)`,
      [tenant_name]
    );

    // Get current tenant information
    const { rows: tenantRow } = await client.query<TenantType, (string | null)[]>(
      'SELECT * FROM tenants WHERE store_name = $1',
      [tenant_name]
    );

    const { rows: current_tenant_name } = await client.query(
      `SELECT current_setting('app.current_tenant_name');`,
      []
    );

    console.log('Transaction.current_tenant_name ==>', current_tenant_name);

    if (tenantRow?.length > 0) {
      const current_tenant = tenantRow[0];
      client.tenant = current_tenant;
      // Set tenant_id session
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