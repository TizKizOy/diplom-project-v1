'use client';

import { Fragment, useEffect, useState } from 'react';
import { adminLogApi, type IAdminLog } from '@/lib/api/adminLog.api';
import styles from './page.module.scss';

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<IAdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    adminLogApi.getAll()
      .then((data) => setLogs(data.sort((a, b) => new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime())))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tables = [...new Set(logs.map((l) => l.tableName).filter(Boolean))].sort();

  const filtered = logs.filter((l) => {
    if (filterAction && l.action !== filterAction) return false;
    if (filterTable && l.tableName !== filterTable) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.adminName?.toLowerCase().includes(q) ||
        l.tableName?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <div className={styles.loading}>Загрузка журнала...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Журнал действий</h1>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по администратору, таблице..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className={styles.select}>
            <option value="">Все действия</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select value={filterTable} onChange={(e) => setFilterTable(e.target.value)} className={styles.select}>
            <option value="">Все таблицы</option>
            {tables.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {(search || filterAction || filterTable) && (
            <button className={styles.btnReset} onClick={() => { setSearch(''); setFilterAction(''); setFilterTable(''); }}>
              Сбросить
            </button>
          )}
        </div>
        <div className={styles.stats}>
          Показано: <strong>{filtered.length}</strong> из <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата и время</th>
              <th>Администратор</th>
              <th>Таблица</th>
              <th>Действие</th>
              <th>Детали</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className={styles.empty}>Записей не найдено</td></tr>
            ) : filtered.map((log) => (
              <Fragment key={log.pkIdLog}>
                <tr className={styles.row}>
                  <td className={styles.dateCell}>
                    {new Date(log.actionTime).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </td>
                  <td className={styles.bold}>{log.adminName || 'Система'}</td>
                  <td className={styles.tableCell}>{log.tableName || '—'}</td>
                  <td>
                    <span className={`${styles.actionBadge} ${styles[ACTION_COLORS[log.action] || 'gray']}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {(log.oldData || log.newData) && (
                      <button
                        className={styles.btnDetails}
                        onClick={() => setExpandedLog(expandedLog === log.pkIdLog ? null : log.pkIdLog)}
                      >
                        {expandedLog === log.pkIdLog ? 'Скрыть' : 'Показать'}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedLog === log.pkIdLog && (
                  <tr className={styles.detailRow}>
                    <td colSpan={5}>
                      <div className={styles.detailContent}>
                        {log.oldData && (
                          <div className={styles.dataBlock}>
                            <span className={styles.dataLabel}>До:</span>
                            <pre className={styles.dataPre}>
                              {JSON.stringify(JSON.parse(log.oldData), null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newData && (
                          <div className={styles.dataBlock}>
                            <span className={styles.dataLabel}>После:</span>
                            <pre className={styles.dataPre}>
                              {JSON.stringify(JSON.parse(log.newData), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
