import type { ICourse, IGroup } from '@/lib/types';

type EnrollRow = {
  fkIdCourse?: number;
  fkIdGroup?: number;
  groupName?: string;
};

/** ID курсов, на которые слушатель записан. */
export function listenerEnrolledCourseIds(
  enrollments: EnrollRow[],
  groups: Array<Pick<IGroup, 'pkIdGroup' | 'fkIdCourse'>>,
): Set<number> {
  const ids = new Set<number>();
  for (const e of enrollments) {
    const direct = e.fkIdCourse;
    if (direct != null && !Number.isNaN(Number(direct))) {
      ids.add(Number(direct));
      continue;
    }
    const gid = e.fkIdGroup;
    if (gid == null) continue;
    const g = groups.find((x) => x.pkIdGroup === gid);
    const cid = g?.fkIdCourse;
    if (cid != null && !Number.isNaN(Number(cid))) ids.add(Number(cid));
  }
  return ids;
}

/** Пары «группа + курс» для «Моё обучение» (по одному курсу — последняя запись). */
export function listenerEnrollmentPairs(
  enrollments: EnrollRow[],
  groups: IGroup[],
  courses: ICourse[],
): { group: IGroup; course: ICourse }[] {
  const out: { group: IGroup; course: ICourse }[] = [];
  const seenCourse = new Set<number>();

  for (const e of enrollments) {
    const cidDirect =
      e.fkIdCourse != null && !Number.isNaN(Number(e.fkIdCourse))
        ? Number(e.fkIdCourse)
        : null;
    const group =
      e.fkIdGroup != null ? groups.find((g) => g.pkIdGroup === e.fkIdGroup) : undefined;
    const cid =
      cidDirect ??
      (group?.fkIdCourse != null ? Number(group.fkIdCourse) : null);
    if (cid == null || Number.isNaN(cid)) continue;
    const course = courses.find((c) => c.pkIdCourse === cid);
    if (!course || seenCourse.has(course.pkIdCourse)) continue;
    seenCourse.add(course.pkIdCourse);

    const g: IGroup =
      group ??
      ({
        pkIdGroup: e.fkIdGroup ?? 0,
        fkIdCourse: cid,
        fkIdCurator: 0,
        name: e.groupName || 'Группа',
        groupName: e.groupName,
        courseTitle: course.title,
        curatorName: '',
        listenerCount: 0,
      } as IGroup);

    out.push({ group: g, course });
  }
  return out;
}
