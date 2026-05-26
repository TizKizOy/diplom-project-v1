'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { Modal } from '@/components/ui';
import styles from './useAppDialog.module.scss';

type DialogState = {
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  resolve: (value: boolean) => void;
};

type AppDialogContextValue = {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const close = useCallback((result: boolean) => {
    setDialog((current) => {
      if (current) {
        if (current.type === 'alert') {
          current.resolve(true);
        } else {
          current.resolve(result);
        }
      }
      return null;
    });
  }, []);

  const alert = useCallback(
    (message: string, title = 'Сообщение') =>
      new Promise<void>((resolve) => {
        setDialog({
          type: 'alert',
          title,
          message,
          resolve: () => resolve(),
        });
      }),
    [],
  );

  const confirm = useCallback(
    (message: string, title = 'Подтверждение') =>
      new Promise<boolean>((resolve) => {
        setDialog({
          type: 'confirm',
          title,
          message,
          resolve,
        });
      }),
    [],
  );

  return (
    <AppDialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialog && (
        <Modal
          isOpen
          onClose={() => close(dialog.type === 'confirm' ? false : true)}
          title={dialog.title}
          size="sm"
        >
          <p className={styles.message}>{dialog.message}</p>
          <div className={styles.actions}>
            {dialog.type === 'confirm' && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => close(false)}
              >
                Отмена
              </button>
            )}
            <button
              type="button"
              className={classNameFor(dialog.type)}
              onClick={() => close(true)}
              autoFocus
            >
              {dialog.type === 'confirm' ? 'Подтвердить' : 'ОК'}
            </button>
          </div>
        </Modal>
      )}
    </AppDialogContext.Provider>
  );
}

function classNameFor(type: 'alert' | 'confirm') {
  return type === 'confirm' ? styles.btnDanger : styles.btnPrimary;
}

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog: оберните приложение в <AppDialogProvider>');
  }
  return ctx;
}
