import { Pool } from 'pg';
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

export const CRUDPool = new Pool({
  host: DEV_NODE_ENV ? '127.0.0.1' : POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  user: POSTGRES_CRUD_USER,
  password: POSTGRES_CRUD_USER_PASSWORD,
  database: POSTGRES_DB,
  max: 15,
});