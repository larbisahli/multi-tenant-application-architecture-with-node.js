export interface TenantType {
    id: string;
    store_name: string;
    first_name: string;
    last_name: string;
    number: string;
    email: string;
    password?: string;
    subdomain?: string;
    status?: 'active' | 'suspended' | 'disabled';
  }