'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';
import { getMaterialTitle, type ICourse, type ILesson, type ITask, type IMaterial } from '@/lib/types';
import type { ICourseTeacher } from '@/lib/api/courseTeachers.api';

interface Props {
  course: ICourse;
  teachers: ICourseTeacher[];
  lessons: ILesson[];
  tasks: ITask[];
  materials: IMaterial[];
  className?: string;
}

export function CourseReportGenerator({
  course,
  teachers,
  lessons,
  tasks,
  materials,
  className,
}: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const safeDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ru-RU');
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`otchet-kurs-${course.pkIdCourse}.pdf`);
  };

  const getLessonTasks = (lessonId: number) =>
    tasks.filter((t) => t.fkIdLesson === lessonId);
  const getLessonMaterials = (lessonId: number) =>
    materials.filter((m) => m.fkIdLesson === lessonId);
  const getGlobalTasks = () => tasks.filter((t) => !t.fkIdLesson);
  const getGlobalMaterials = () => materials.filter((m) => !m.fkIdLesson);

  const totalTasks = tasks.length;
  const totalMaterials = materials.length;
  const totalScore = tasks.reduce((sum, t) => sum + (t.maxScore || 0), 0);

  return (
    <>
      <button onClick={downloadPDF} className={className}>
        Скачать отчёт PDF
      </button>

      <div
        ref={reportRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '800px',
          background: 'white',
          padding: '40px',
          fontFamily: 'Arial, sans-serif',
          color: '#000',
          fontSize: '14px',
          lineHeight: 1.5,
        }}
      >
        {/* ШАПКА */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
            borderBottom: '1px solid #000',
            paddingBottom: '20px',
          }}
        >
          <h1
            style={{
              margin: '0 0 10px 0',
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >
            ОТЧЁТ ПО КУРСУ
          </h1>
          <p style={{ margin: 0, fontSize: '12px' }}>
            Сформирован: {new Date().toLocaleDateString('ru-RU')}{' '}
            {new Date().toLocaleTimeString('ru-RU')}
          </p>
        </div>

        {/* НАЗВАНИЕ КУРСА */}
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '18px',
          }}
        >
          {course.title}
        </h2>

        {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
        <div style={{ marginBottom: '30px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '15px',
            }}
          >
            Общая информация
          </h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #ccc',
                    width: '30%',
                  }}
                >
                  <strong>Статус:</strong>
                </td>
                <td
                  style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}
                >
                  {course.statusName}
                </td>
              </tr>
              <tr>
                <td
                  style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}
                >
                  <strong>Дата начала:</strong>
                </td>
                <td
                  style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}
                >
                  {safeDate(course.startDate)}
                </td>
              </tr>
              <tr>
                <td
                  style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}
                >
                  <strong>Дата окончания:</strong>
                </td>
                <td
                  style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}
                >
                  {safeDate(course.endDate)}
                </td>
              </tr>
              {course.tags && (
                <tr>
                  <td
                    style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}
                  >
                    <strong>Теги:</strong>
                  </td>
                  <td
                    style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}
                  >
                    {course.tags}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: '15px' }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Описание:</p>
            <p style={{ margin: 0 }}>
              {course.description || 'Описание отсутствует'}
            </p>
          </div>
        </div>

        {/* СТАТИСТИКА */}
        <div style={{ marginBottom: '30px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '15px',
            }}
          >
            Статистика
          </h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th
                  style={{
                    padding: '10px',
                    border: '1px solid #000',
                    textAlign: 'left',
                  }}
                >
                  Показатель
                </th>
                <th
                  style={{
                    padding: '10px',
                    border: '1px solid #000',
                    textAlign: 'center',
                  }}
                >
                  Значение
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #000' }}>
                  Количество уроков
                </td>
                <td
                  style={{
                    padding: '10px',
                    border: '1px solid #000',
                    textAlign: 'center',
                  }}
                >
                  {lessons.length}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #000' }}>
                  Количество заданий
                </td>
                <td
                  style={{
                    padding: '10px',
                    border: '1px solid #000',
                    textAlign: 'center',
                  }}
                >
                  {totalTasks}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #000' }}>
                  Количество материалов
                </td>
                <td
                  style={{
                    padding: '10px',
                    border: '1px solid #000',
                    textAlign: 'center',
                  }}
                >
                  {totalMaterials}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #000' }}>
                  Максимальный балл
                </td>
                <td
                  style={{
                    padding: '10px',
                    border: '1px solid #000',
                    textAlign: 'center',
                  }}
                >
                  {totalScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ПРЕПОДАВАТЕЛИ */}
        <div style={{ marginBottom: '30px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '15px',
            }}
          >
            Преподаватели
          </h3>
          {teachers.length > 0 ? (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th
                    style={{
                      padding: '10px',
                      border: '1px solid #000',
                      textAlign: 'left',
                      width: '10%',
                    }}
                  >
                    №
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      border: '1px solid #000',
                      textAlign: 'left',
                    }}
                  >
                    ФИО
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      border: '1px solid #000',
                      textAlign: 'left',
                    }}
                  >
                    Дата назначения
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, idx) => (
                  <tr key={t.pkIdCourseTeacher}>
                    <td style={{ padding: '10px', border: '1px solid #000' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #000' }}>
                      {t.teacherName}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #000' }}>
                      {safeDate(t.assignedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Преподаватели не назначены</p>
          )}
        </div>

        {/* ПРОГРАММА КУРСА */}
        <div style={{ marginBottom: '30px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '15px',
            }}
          >
            Программа курса
          </h3>
          {lessons.length > 0 ? (
            <div>
              {lessons.map((lesson, idx) => {
                const lessonTasks = getLessonTasks(lesson.pkIdLesson);
                const lessonMaterials = getLessonMaterials(lesson.pkIdLesson);

                return (
                  <div
                    key={lesson.pkIdLesson}
                    style={{
                      marginBottom: '20px',
                      padding: '15px',
                      border: '1px solid #000',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {idx + 1}. {lesson.title}
                    </h4>

                    {lesson.description && (
                      <p style={{ margin: '0 0 15px 0' }}>
                        {lesson.description}
                      </p>
                    )}

                    {lessonTasks.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <p
                          style={{
                            margin: '0 0 5px 0',
                            fontWeight: 'bold',
                            fontSize: '13px',
                          }}
                        >
                          Задания:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {lessonTasks.map((task) => (
                            <li
                              key={task.pkIdTask}
                              style={{ marginBottom: '5px', fontSize: '13px' }}
                            >
                              {task.title} — {task.taskTypeName},{' '}
                              {task.maxScore} балл.
                              {task.deadline && (
                                <span>
                                  {' '}
                                  (до{' '}
                                  {safeDate(task.deadline)}
                                  )
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lessonMaterials.length > 0 && (
                      <div>
                        <p
                          style={{
                            margin: '0 0 5px 0',
                            fontWeight: 'bold',
                            fontSize: '13px',
                          }}
                        >
                          Материалы:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {lessonMaterials.map((mat) => (
                            <li
                              key={mat.pkIdMaterial}
                              style={{ marginBottom: '5px', fontSize: '13px' }}
                            >
                              {getMaterialTitle(mat)} — {mat.typeName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Уроки пока не добавлены</p>
          )}
        </div>

        {/* ОБЩИЕ ЗАДАНИЯ И МАТЕРИАЛЫ */}
        {(getGlobalTasks().length > 0 || getGlobalMaterials().length > 0) && (
          <div style={{ marginBottom: '30px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '15px',
              }}
            >
              Дополнительные материалы и задания
            </h3>

            {getGlobalTasks().length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  Общие задания курса:
                </p>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #000',
                          textAlign: 'left',
                        }}
                      >
                        Название
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #000',
                          textAlign: 'left',
                        }}
                      >
                        Тип
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #000',
                          textAlign: 'center',
                        }}
                      >
                        Баллы
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getGlobalTasks().map((task) => (
                      <tr key={task.pkIdTask}>
                        <td
                          style={{ padding: '8px', border: '1px solid #000' }}
                        >
                          {task.title}
                        </td>
                        <td
                          style={{ padding: '8px', border: '1px solid #000' }}
                        >
                          {task.taskTypeName}
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            border: '1px solid #000',
                            textAlign: 'center',
                          }}
                        >
                          {task.maxScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {getGlobalMaterials().length > 0 && (
              <div>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  Дополнительные материалы:
                </p>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #000',
                          textAlign: 'left',
                        }}
                      >
                        Название
                      </th>
                      <th
                        style={{
                          padding: '8px',
                          border: '1px solid #000',
                          textAlign: 'left',
                        }}
                      >
                        Тип
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getGlobalMaterials().map((mat) => (
                      <tr key={mat.pkIdMaterial}>
                        <td
                          style={{ padding: '8px', border: '1px solid #000' }}
                        >
                          {getMaterialTitle(mat)}
                        </td>
                        <td
                          style={{ padding: '8px', border: '1px solid #000' }}
                        >
                          {mat.typeName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* СВОДКА */}
        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            border: '2px solid #000',
          }}
        >
          <h3
            style={{
              margin: '0 0 20px 0',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            КАРТОЧКА КУРСА
          </h3>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                    width: '40%',
                  }}
                >
                  Название
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {course.title}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Статус
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {course.statusName}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Период проведения
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {safeDate(course.startDate)} — {safeDate(course.endDate)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Преподавателей
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {teachers.length}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Уроков
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {lessons.length}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Заданий
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {totalTasks}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Материалов
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {totalMaterials}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Максимальный балл
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {totalScore}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px',
                    border: '1px solid #000',
                    fontWeight: 'bold',
                  }}
                >
                  Продолжительность
                </td>
                <td style={{ padding: '8px', border: '1px solid #000' }}>
                  {Math.ceil(
                    (new Date(course.endDate).getTime() -
                      new Date(course.startDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{' '}
                  дней
                </td>
              </tr>
              {course.tags && (
                <tr>
                  <td
                    style={{
                      padding: '8px',
                      border: '1px solid #000',
                      fontWeight: 'bold',
                    }}
                  >
                    Теги
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #000' }}>
                    {course.tags}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ПОДВАЛ */}
        <div
          style={{
            marginTop: '30px',
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #000',
            fontSize: '12px',
          }}
        >
          <p>Отчёт сформирован автоматически системой МГИРО</p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </div>
    </>
  );
}
