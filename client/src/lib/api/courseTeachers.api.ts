import apiClient from './apiClient';

export interface ICourseTeacher {
  pkIdCourseTeacher: number;
  assignedAt: string;
  courseTitle: string;
  teacherName: string;
  fkIdCourse: number;
  fkIdTeacher: number;
}

export interface ICourseTeacherDetailed extends ICourseTeacher {
  fkIdCourse: number;
  fkIdTeacher: number;
}

export interface ICreateCourseTeacherDto {
  courseId: number;
  teacherId: number;
}

export const courseTeachersApi = {
  getAll: async (): Promise<ICourseTeacher[]> => {
    const response = await apiClient.get('/course-teachers');
    return response.data;
  },

  getByCourse: async (courseId: number): Promise<ICourseTeacher[]> => {
    const response = await apiClient.get(`/course-teachers/course/${courseId}`);
    return response.data;
  },

  getByTeacher: async (
    teacherId: number,
  ): Promise<ICourseTeacherDetailed[]> => {
    const response = await apiClient.get(
      `/course-teachers/teacher/${teacherId}`,
    );
    return response.data;
  },

  create: async (dto: ICreateCourseTeacherDto): Promise<ICourseTeacher> => {
    const response = await apiClient.post('/course-teachers', dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/course-teachers/${id}`);
    return response.data;
  },
};
