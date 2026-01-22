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
      <h1 className={styles.pageText}>Привет это страничка Главная</h1>
    </div>
  );
}
