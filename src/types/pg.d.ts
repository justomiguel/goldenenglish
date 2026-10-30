declare module "pg" {
  export interface QueryResult<T> {
    rows: T[];
    rowCount: number | null;
  }

  export class Client {
    constructor(config: { connectionString: string; connectionTimeoutMillis?: number });
    connect(): Promise<void>;
    query<T = Record<string, unknown>>(
      sql: string,
      params?: readonly unknown[],
    ): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }

  const pg: { Client: typeof Client };
  export default pg;
}
