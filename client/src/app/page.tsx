// Home.tsx
import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>
        <span>Выше</span> — Твой рост начинается здесь.
      </h2>

      <section className={styles.catalog}>
        {/* Программирование */}
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Программирование</h3>
          <p className={styles.cardCount}>78 курсов</p>
          <button className={styles.cardBtn}>Попробовать бесплатно</button>
        </article>

        {/* Анализ данных */}
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Анализ данных</h3>
          <p className={styles.cardCount}>40 курсов</p>
          <button className={styles.cardBtn}>Попробовать бесплатно</button>
        </article>

        {/* Дизайн */}
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Дизайн</h3>
          <p className={styles.cardCount}>22 курса</p>
          <button className={styles.cardBtn}>Попробовать бесплатно</button>
        </article>
      </section>
    </div>
  );
}
