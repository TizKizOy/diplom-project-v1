import styles from './page.module.scss';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Страница Главная',
  description: 'Страница Главная',
  keywords: 'abobbb',
};

export default function Main() {
  return (
    <div className={styles.page}>
      <h1 className={styles.pageText}>Привет, это страничка Главная</h1>

      <section className={styles.adminSection}>
        <h2 className={styles.sectionTitle}>Администрирование</h2>

        {/* Управление пользователями */}
        <div className={styles.adminBlock}>
          <h3>Управление пользователями</h3>
          <form className={styles.userForm}>
            <input
              type="text"
              placeholder="Имя пользователя"
              className={styles.inputField}
            />
            <input
              type="email"
              placeholder="Email"
              className={styles.inputField}
            />
            <select className={styles.selectField}>
              <option>Роль: Администратор</option>
              <option>Роль: Преподаватель</option>
              <option>Роль: Слушатель</option>
            </select>
            <div className={styles.formActions}>
              <button className={styles.submitButton}>
                Создать пользователя
              </button>
              <button className={styles.actionButton}>Редактировать</button>
              <button className={styles.blockButton}>Заблокировать</button>
            </div>
          </form>
        </div>

        {/* Настройка ролей и прав доступа */}
        <div className={styles.adminBlock}>
          <h3>Настройка ролей и прав доступа</h3>
          <table className={styles.rolesTable}>
            <thead>
              <tr>
                <th>Роль</th>
                <th>Права доступа</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Администратор</td>
                <td>Полный доступ</td>
                <td>
                  <button className={styles.actionButton}>Редактировать</button>
                </td>
              </tr>
              <tr>
                <td>Преподаватель</td>
                <td>Управление курсами, просмотр групп</td>
                <td>
                  <button className={styles.actionButton}>Редактировать</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Управление системными параметрами */}
        <div className={styles.adminBlock}>
          <h3>Управление системными параметрами</h3>
          <form className={styles.settingsForm}>
            <div className={styles.settingItem}>
              <label>Максимальное количество пользователей:</label>
              <input type="number" className={styles.inputField} />
            </div>
            <div className={styles.settingItem}>
              <label>Время сессии (минут):</label>
              <input type="number" className={styles.inputField} />
            </div>
            <button className={styles.submitButton}>Сохранить настройки</button>
          </form>
        </div>

        {/* Логи безопасности и действий пользователей */}
        <div className={styles.adminBlock}>
          <h3>Логи безопасности и действий пользователей</h3>
          <table className={styles.logsTable}>
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>24.01.2026 14:30</td>
                <td>Администратор</td>
                <td>Создание пользователя</td>
                <td>Успешно</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
