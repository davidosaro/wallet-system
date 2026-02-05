import { QueryInterface } from 'sequelize';

export async function tableExists(
  queryInterface: QueryInterface,
  tableName: string
): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.includes(tableName);
}

export async function createIndexIfNotExists(
  queryInterface: QueryInterface,
  tableName: string,
  columns: string[]
): Promise<void> {
  const indexName = `${tableName}_${columns.join('_')}`;
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')})`
  );
}

export async function columnExists(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const description = await queryInterface.describeTable(tableName);
  return columnName in description;
}
