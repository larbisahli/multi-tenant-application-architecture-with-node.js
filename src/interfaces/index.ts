declare module 'pg' {
  export interface PoolClient {
    tenant?: TenantType | null;
  }
}
export interface TenantType {
  id: string;
  store_name: string;
  fullname: string;
  email: string;
  status: 'active' | 'suspended' | 'disabled';
  created_at: string | number | Date;
}

export interface ProductType {
  id: string;
  tenant_id: string;
  product_name: string;
  sale_price: number;
  compare_price: number;
  quantity: number;
  product_description: string;
  published: boolean;
  created_at: string | number | Date;
}
