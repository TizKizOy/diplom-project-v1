'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { messagesApi, type IMessage } from '@/lib/api/messages.api';
import { usersApi } from '@/lib/api/users.api';
import type { IUser } from '@/lib/types';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import styles from './page.module.scss';

interface IDialog {
  userId: number;
  userName: string;
  messages: IMessage[];
  lastMessage: IMessage;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();

  const [dialogs, setDialogs] = useState<IDialog[]>([]);
  const [activeDialog, setActiveDialog] = useState<IDialog | null>(null);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newReceiverId, setNewReceiverId] = useState('');
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [loadError, setLoadError] = useState('');
  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ru-RU');
  };
  const formatTime = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? '—'
      : parsed.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const [sent, received, contacts] = await Promise.all([
        messagesApi.getBySender(user.pkIdUser),
        messagesApi.getByReceiver(user.pkIdUser),
        usersApi.getMessagingContacts(),
      ]);
      setAllUsers(contacts.filter((u) => u.pkIdUser !== user.pkIdUser));
      buildDialogs(sent, received, user.pkIdUser, contacts);
    } catch (err) {
      setDialogs([]);
      setLoadError(getApiErrorMessage(err, 'Не удалось загрузить сообщения'));
    } finally {
      setLoading(false);
    }
  };

  const buildDialogs = (
    sent: IMessage[],
    received: IMessage[],
    myId: number,
    contacts: IUser[],
  ) => {
    const dialogMap = new Map<number, IMessage[]>();
    sent.forEach((m) => {
      const otherId = m.fkIdReceiver;
      if (otherId == null || Number.isNaN(Number(otherId))) return;
      if (!dialogMap.has(otherId)) dialogMap.set(otherId, []);
      dialogMap.get(otherId)!.push(m);
    });
    received.forEach((m) => {
      const otherId = m.fkIdSender;
      if (otherId == null || Number.isNaN(Number(otherId))) return;
      if (!dialogMap.has(otherId)) dialogMap.set(otherId, []);
      dialogMap.get(otherId)!.push(m);
    });
    const result: IDialog[] = [];
    dialogMap.forEach((msgs, userId) => {
      const sorted = msgs.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const last = sorted[sorted.length - 1];
      const unread = msgs.filter((m) => m.fkIdSender === userId && !m.isRead).length;
      const contact = contacts.find((c) => c.pkIdUser === userId);
      const userName =
        contact?.fullName ||
        (last.fkIdSender === userId ? last.senderName : last.receiverName) ||
        `Пользователь #${userId}`;
      result.push({ userId, userName, messages: sorted, lastMessage: last, unreadCount: unread });
    });
    result.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    setDialogs(result);
  };

  const handleSelectDialog = async (dialog: IDialog) => {
    setActiveDialog(dialog);
    setShowNewMsg(false);
    const unread = dialog.messages.filter((m) => m.fkIdSender === dialog.userId && !m.isRead);
    for (const m of unread) {
      try { await messagesApi.markRead(m.pkIdMessage); } catch {}
    }
    setDialogs((prev) =>
      prev.map((d) =>
        d.userId === dialog.userId
          ? { ...d, unreadCount: 0, messages: d.messages.map((m) => (m.fkIdSender === dialog.userId ? { ...m, isRead: true } : m)) }
          : d,
      ),
    );
  };

  const handleSend = async () => {
    if (!user || !newText.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const receiverId = activeDialog ? activeDialog.userId : Number(newReceiverId);
      if (!receiverId) { setSendError('Выберите получателя'); setSending(false); return; }
      await messagesApi.create({ senderId: user.pkIdUser, receiverId, message: newText.trim() });
      setNewText('');
      setShowNewMsg(false);
      setNewReceiverId('');
      await loadData();
    } catch (err) {
      setSendError(getApiErrorMessage(err, 'Ошибка отправки'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Сообщения</h1>
        <button className={styles.btnNew} onClick={() => { setShowNewMsg(true); setActiveDialog(null); }}>
          + Новое сообщение
        </button>
      </div>
      {loadError && <p className={styles.errorText}>{loadError}</p>}

      <div className={styles.layout}>
        {/* Dialogs list */}
        <div className={styles.sidebar}>
          {dialogs.length === 0 && <p className={styles.empty}>Нет диалогов</p>}
          {dialogs.map((d) => (
            <div
              key={d.userId}
              className={`${styles.dialogItem} ${activeDialog?.userId === d.userId ? styles.activeDialog : ''}`}
              onClick={() => handleSelectDialog(d)}
            >
              <div className={styles.dialogAvatar}>{d.userName?.[0]?.toUpperCase() || '?'}</div>
              <div className={styles.dialogInfo}>
                <div className={styles.dialogTop}>
                  <strong>{d.userName}</strong>
                  <span className={styles.dialogTime}>{formatDate(d.lastMessage.createdAt)}</span>
                </div>
                <div className={styles.dialogBottom}>
                  <span className={styles.dialogPreview}>{d.lastMessage.message}</span>
                  {d.unreadCount > 0 && <span className={styles.unreadBadge}>{d.unreadCount}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat area */}
        <div className={styles.chat}>
          {!activeDialog && !showNewMsg && (
            <div className={styles.chatEmpty}>
              <span>💬</span>
              <p>Выберите диалог или напишите новое сообщение</p>
            </div>
          )}

          {activeDialog && !showNewMsg && (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatAvatar}>{activeDialog.userName?.[0]?.toUpperCase()}</div>
                <strong>{activeDialog.userName}</strong>
              </div>
              <div className={styles.messages}>
                {activeDialog.messages.map((m) => {
                  const isMine = m.fkIdSender === user?.pkIdUser;
                  return (
                    <div key={m.pkIdMessage} className={`${styles.message} ${isMine ? styles.mine : styles.theirs}`}>
                      <div className={styles.msgBubble}>{m.message}</div>
                      <span className={styles.msgTime}>
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.replyForm}>
                <textarea
                  className={styles.replyInput}
                  rows={2}
                  placeholder="Написать сообщение..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button className={styles.btnSend} onClick={handleSend} disabled={sending || !newText.trim()}>
                  {sending ? '...' : '→'}
                </button>
              </div>
            </>
          )}

          {showNewMsg && (
            <div className={styles.newMsgForm}>
              <div className={styles.newMsgHeader}>
                <h2>Новое сообщение</h2>
                <button className={styles.closeBtn} onClick={() => setShowNewMsg(false)}>×</button>
              </div>
              <label className={styles.field}>
                <span>Получатель</span>
                <select value={newReceiverId} onChange={(e) => setNewReceiverId(e.target.value)}>
                  <option value="">Выберите пользователя...</option>
                  {allUsers.map((u) => (
                    <option key={u.pkIdUser} value={u.pkIdUser}>{u.fullName} ({u.roleName})</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Сообщение</span>
                <textarea rows={5} value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Текст сообщения..." />
              </label>
              {sendError && <p className={styles.errorText}>{sendError}</p>}
              <div className={styles.newMsgActions}>
                <button className={styles.btnCancel} onClick={() => setShowNewMsg(false)}>Отмена</button>
                <button className={styles.btnPrimary} onClick={handleSend} disabled={sending || !newText.trim() || !newReceiverId}>
                  {sending ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
