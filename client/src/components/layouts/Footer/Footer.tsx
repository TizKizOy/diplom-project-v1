'use client';

import React from 'react';
import styles from './Footer.module.scss';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>© 2025 МГИРО. Все права защищены.</p>
      </div>
    </footer>
  );
};
