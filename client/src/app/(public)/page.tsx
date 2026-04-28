import Link from 'next/link';
import styles from './page.module.scss';
import arrowSvg from '../../../public/Arrow.svg';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>МГИРО</h1>
        <Link href="/auth" className={styles.profileButton}>
          Войти
        </Link>
      </header>

      <main className={styles.main}>
        <h2 className={styles.title}>
          Повышай квалификацию вместе с МГИРО
        </h2>
        <p className={styles.subtitle}>
          Дистанционные курсы для педагогических работников
        </p>

        <Link href="/auth/register" className={styles.ctaButton}>
          Начать учиться
        </Link>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h3>Следующая ступень в карьере вместе с нами</h3>
          </div>
          <div className={styles.featureCard}>
            <h3>Преподаем современно и качественно</h3>
          </div>
          <div className={styles.featureCard}>
            <h3>Зажигаем на покорение вершин</h3>
          </div>
        </div>
      </main>
    </div>
  );
}
