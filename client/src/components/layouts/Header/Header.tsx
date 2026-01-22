import Link from 'next/link';
import styles from './Header.module.scss';

const Header = () => {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Next JS
      </Link>

      <nav className={styles.nav}>
        <Link href="/">Home</Link>
        <Link href="/account">Account</Link>
        <Link href="/auth">Auth</Link>
        <Link href="/main">Main</Link>
      </nav>
    </header>
  );
};

export default Header;
