export type EntityId = string;
export type ISODateString = string;

export interface Teacher {
  id: EntityId;
  fullName: string;
  nationalCode?: string;
  avatar: string;
  bio: string;
  createdAt: ISODateString;
}

export interface Student {
  id: EntityId;
  fullName: string;
  nationalCode?: string;
  avatar: string;
  birthYear?: number;
  progress: Record<string, any>;
  createdAt: ISODateString;
}

export interface Classroom {
  id: EntityId;
  name: string;
  gradeLevel: 1;
  academicYear: string;
  teacherId: EntityId;
  studentIds: EntityId[];
  createdAt: ISODateString;
}

export interface AppState {
  activeClassroomId: EntityId | null;
  activeStudentId: EntityId | null;
  classrooms: Record<EntityId, Classroom>;
  teachers: Record<EntityId, Teacher>;
  students: Record<EntityId, Student>;
}

export type CreateTeacherInput = Omit<Teacher, 'id' | 'createdAt'> &
  Partial<Pick<Teacher, 'id' | 'createdAt'>>;

export type CreateStudentInput = Omit<Student, 'id' | 'createdAt'> &
  Partial<Pick<Student, 'id' | 'createdAt'>>;

export type CreateClassroomInput = Omit<Classroom, 'id' | 'createdAt' | 'gradeLevel'> &
  Partial<Pick<Classroom, 'id' | 'createdAt' | 'gradeLevel'>>;

export type TeacherChanges = Partial<Omit<Teacher, 'id' | 'createdAt'>>;
export type StudentChanges = Partial<Omit<Student, 'id' | 'createdAt'>>;
export type ClassroomChanges = Partial<Omit<Classroom, 'id' | 'createdAt'>>;
