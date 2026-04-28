import * as sql from 'mssql';

const dbConfig = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
  },
};

const pool = new sql.ConnectionPool(dbConfig);

pool.on('error', err => {
  console.error('DB Pool Error:', err.message); 
});

export const query = async <T>(
  sqlQuery: string,
  params?: Record<string, any>,
  userId?: number,
): Promise<T[]> => {
  try {
    if (!pool.connected) {
      await pool.connect();
    }

    const request = pool.request();
    

    if (userId) {
      request.input('auditUserId', sql.Int, userId);
      await request.query(`
        DECLARE @ctx VARBINARY(128) = CAST(@auditUserId AS VARBINARY(128));
        SET CONTEXT_INFO @ctx;
      `);
    }


    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, getSqlType(value), value);
      });
    }

    const result = await request.query(sqlQuery);
    return result.recordset as T[];
  } catch (err) {
    console.error('SQL query error:', err);
    throw err;
  }
};

function getSqlType(value: any) {
  if (value === null || value === undefined) return sql.NVarChar;
  if (typeof value === 'number') return sql.Int;
  if (typeof value === 'string')
    return value.length > 4000 ? sql.NVarChar(sql.MAX) : sql.NVarChar;
  if (value instanceof Date) return sql.DateTime;
  if (typeof value === 'boolean') return sql.Bit;
  return sql.NVarChar;
}

export const checkDbConnection = async (): Promise<boolean> => {
  try {
    await pool.connect();
    const result = await query<{ ok: number }>('SELECT 1 AS ok');
    if (result?.[0]?.ok === 1) {
      console.log('SQL Server connection successful.');
      return true;
    }
  } catch (e) {
    console.error('SQL Server connection error:', e);
  }
  return false;
};

process.on('SIGINT', async () => {
  try {
    await pool.close();
    console.log('SQL Server pool closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing SQL Server pool:', err);
    process.exit(1);
  }
});
