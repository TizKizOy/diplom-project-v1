'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { ROLES } from '@/lib/constants';
import styles from './page.module.scss';

export default function HelpPage() {
  const { checkRole } = useAuth();
  const isAdmin = checkRole([ROLES.ADMIN]);
  const isTeacher = checkRole([ROLES.TEACHER]);
  const isListener = checkRole([ROLES.LISTENER]);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Справка по системе</h1>
      <p className={styles.lead}>
        Краткое руководство по разделам приложения. Разделы ниже показываются в соответствии с вашей ролью.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Общее для всех</h2>
        <ul className={styles.list}>
          <li>
            <strong>Боковое меню</strong> — переход между разделами. На узком экране откройте меню кнопкой «☰» вверху.
          </li>
          <li>
            <strong>Выход</strong> — кнопка «↩» под именем внизу боковой панели.
          </li>
          <li>
            Эта страница <strong>Справка</strong> доступна из пункта меню «? Справка».
          </li>
        </ul>
      </section>

      {isListener && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Слушатель</h2>
          <ul className={styles.list}>
            <li>
              <strong>Моё обучение</strong> — обзор ваших курсов и быстрые ссылки.
            </li>
            <li>
              <strong>Курсы</strong> — каталог. Для опубликованного курса нажмите «Записаться», если вы ещё не в группе.
            </li>
            <li>
              После записи уроки открываются <strong>по порядку</strong>: следующий урок доступен, когда по предыдущему все задания приняты.
            </li>
            <li>
              На странице курса слева (в режиме прохождения) — <strong>программа</strong> и прогресс по урокам.
            </li>
            <li>
              <strong>Тесты</strong> — откройте задание типа «Тест», затем «Начать тест». Ответы сохраняются при отправке; при успехе статус может стать «Принято» автоматически.
            </li>
            <li>
              <strong>Практические и теоретические задания</strong> — введите ответ в форме и отправьте на проверку; дождитесь статуса «Принято» или комментария преподавателя.
            </li>
            <li>
              <strong>Сообщения</strong> — переписка с преподавателями и администраторами из ваших курсов.
            </li>
            <li>
              <strong>Сертификаты</strong> — после завершения курса при наличии шаблона сертификат можно получить здесь.
            </li>
            <li>
              <strong>Профиль</strong> — личные данные и смена пароля (если доступно).
            </li>
          </ul>
          <p className={styles.note}>
            Если видите «Недостаточно прав» или урок не открывается — проверьте, что вы записаны на курс и завершили предыдущий урок.
          </p>
        </section>
      )}

      {isTeacher && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Преподаватель</h2>
          <ul className={styles.list}>
            <li>
              <strong>Курсы</strong> — карточки курсов, где вы назначены преподавателем; откройте курс и перейдите в <strong>Управление</strong>.
            </li>
            <li>
              В <strong>Управлении курсом</strong>: уроки, задания, материалы, группы, вкладка <strong>Попытки</strong> — все сдачи слушателей по этому курсу.
            </li>
            <li>
              В «Попытках» нажмите <strong>«Просмотр и оценка»</strong>: текст ответа, для тестов — выбранные варианты; выставьте балл, примите, отклоните или отправьте на доработку. Можно изменить балл у уже принятой работы («Сохранить балл»).
            </li>
            <li>
              <strong>Аналитика</strong> — сводные показатели (если раздел доступен вашей роли).
            </li>
            <li>
              <strong>Группы</strong> — список учебных групп (совместно с администратором в части функций).
            </li>
          </ul>
        </section>
      )}

      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Администратор</h2>
          <ul className={styles.list}>
            <li>
              <strong>Пользователи</strong> — создание учётных записей, роли, блокировки.
            </li>
            <li>
              <strong>Курсы (админ)</strong> — создание курсов, статусы, назначение преподавателей.
            </li>
            <li>
              <strong>Группы</strong> — учебные группы и слушатели.
            </li>
            <li>
              <strong>Отчёты</strong> и <strong>Журнал</strong> — выгрузки и журнал действий в системе.
            </li>
            <li>
              В <strong>Управлении курсом</strong> вы видите те же вкладки, что и преподаватель, включая <strong>все попытки</strong> по курсу и назначение преподавателей.
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
