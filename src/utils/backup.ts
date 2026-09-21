import type { AppState, Classroom, Student, Teacher } from '../types/hodhodak';
import { useHodhodakStore } from '../store/useHodhodakStore';

const APP_VERSION = '1.0.0';
const MAX_BACKUP_SIZE_BYTES = 10 * 1024 * 1024;

export type ImportStrategy = 'overwrite' | 'merge';

export interface BackupMetadata {
  appVersion: typeof APP_VERSION;
  exportedAt: string;
  checksum: string;
}

export interface BackupData extends AppState {}

export interface BackupDocument {
  metadata: BackupMetadata;
  data: BackupData;
}

export interface ImportResult {
  strategy: ImportStrategy;
  classroomsAdded: number;
  teachersAdded: number;
  studentsAdded: number;
  skippedDuplicates: number;
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const fail = (message: string): never => {
  throw new BackupValidationError(message);
};

const requireRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new BackupValidationError(`بخش «${path}» باید یک شیء معتبر باشد.`);
  }
  return value;
};

const requireString = (value: unknown, path: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BackupValidationError(`فیلد «${path}» باید یک متن غیرخالی باشد.`);
  }
  return value;
};

const requireOptionalString = (value: unknown, path: string): string | undefined => {
  if (value === undefined) return undefined;
  return requireString(value, path);
};

const requireNullableId = (value: unknown, path: string): string | null => {
  if (value === null) return null;
  return requireString(value, path);
};

const requireIsoDate = (value: unknown, path: string): string => {
  const date = requireString(value, path);
  if (Number.isNaN(Date.parse(date))) fail(`تاریخ «${path}» معتبر نیست.`);
  return date;
};

const validateTeacher = (value: unknown, key: string): Teacher => {
  const teacher = requireRecord(value, `teachers.${key}`);
  const id = requireString(teacher.id, `teachers.${key}.id`);
  if (id !== key) fail(`شناسهٔ آموزگار «${key}» با کلید ذخیره‌شده هماهنگ نیست.`);

  return {
    id,
    fullName: requireString(teacher.fullName, `teachers.${key}.fullName`),
    nationalCode: requireOptionalString(teacher.nationalCode, `teachers.${key}.nationalCode`),
    avatar: requireString(teacher.avatar, `teachers.${key}.avatar`),
    bio: requireString(teacher.bio, `teachers.${key}.bio`),
    createdAt: requireIsoDate(teacher.createdAt, `teachers.${key}.createdAt`),
  };
};

const validateStudent = (value: unknown, key: string): Student => {
  const student = requireRecord(value, `students.${key}`);
  const id = requireString(student.id, `students.${key}.id`);
  if (id !== key) fail(`شناسهٔ دانش‌آموز «${key}» با کلید ذخیره‌شده هماهنگ نیست.`);
  if (student.birthYear !== undefined && !Number.isInteger(student.birthYear)) {
    fail(`سال تولد دانش‌آموز «${key}» معتبر نیست.`);
  }

  return {
    id,
    fullName: requireString(student.fullName, `students.${key}.fullName`),
    nationalCode: requireOptionalString(student.nationalCode, `students.${key}.nationalCode`),
    avatar: requireString(student.avatar, `students.${key}.avatar`),
    birthYear: student.birthYear as number | undefined,
    progress: requireRecord(student.progress, `students.${key}.progress`),
    createdAt: requireIsoDate(student.createdAt, `students.${key}.createdAt`),
  };
};

const validateClassroom = (value: unknown, key: string): Classroom => {
  const classroom = requireRecord(value, `classrooms.${key}`);
  const id = requireString(classroom.id, `classrooms.${key}.id`);
  if (id !== key) fail(`شناسهٔ کلاس «${key}» با کلید ذخیره‌شده هماهنگ نیست.`);
  if (classroom.gradeLevel !== 1) fail(`پایهٔ کلاس «${key}» باید ۱ باشد.`);
  const rawStudentIds = classroom.studentIds;
  if (!Array.isArray(rawStudentIds)) {
    throw new BackupValidationError(`فهرست دانش‌آموزان کلاس «${key}» معتبر نیست.`);
  }

  const studentIds = rawStudentIds.map((studentId, index) =>
    requireString(studentId, `classrooms.${key}.studentIds.${index}`),
  );
  if (new Set(studentIds).size !== studentIds.length) {
    fail(`در کلاس «${key}» شناسهٔ دانش‌آموز تکراری وجود دارد.`);
  }

  return {
    id,
    name: requireString(classroom.name, `classrooms.${key}.name`),
    gradeLevel: 1,
    academicYear: requireString(classroom.academicYear, `classrooms.${key}.academicYear`),
    teacherId: requireString(classroom.teacherId, `classrooms.${key}.teacherId`),
    studentIds,
    createdAt: requireIsoDate(classroom.createdAt, `classrooms.${key}.createdAt`),
  };
};

const validateDictionary = <T>(
  value: unknown,
  path: string,
  validator: (entry: unknown, key: string) => T,
): Record<string, T> => {
  const dictionary = requireRecord(value, path);
  return Object.fromEntries(
    Object.entries(dictionary).map(([key, entry]) => [key, validator(entry, key)]),
  );
};

const validateBackupData = (value: unknown): BackupData => {
  const data = requireRecord(value, 'data');
  const teachers = validateDictionary(data.teachers, 'teachers', validateTeacher);
  const students = validateDictionary(data.students, 'students', validateStudent);
  const classrooms = validateDictionary(data.classrooms, 'classrooms', validateClassroom);
  const activeClassroomId = requireNullableId(data.activeClassroomId, 'activeClassroomId');
  const activeStudentId = requireNullableId(data.activeStudentId, 'activeStudentId');

  Object.values(classrooms).forEach((classroom) => {
    if (!teachers[classroom.teacherId]) {
      fail(`آموزگار کلاس «${classroom.name}» در فایل پشتیبان وجود ندارد.`);
    }
    classroom.studentIds.forEach((studentId) => {
      if (!students[studentId]) {
        fail(`دانش‌آموزی با شناسهٔ «${studentId}» برای کلاس «${classroom.name}» پیدا نشد.`);
      }
    });
  });

  if (activeClassroomId && !classrooms[activeClassroomId]) {
    fail('کلاس فعال فایل پشتیبان در فهرست کلاس‌ها وجود ندارد.');
  }
  if (activeStudentId && !students[activeStudentId]) {
    fail('دانش‌آموز فعال فایل پشتیبان در فهرست دانش‌آموزان وجود ندارد.');
  }
  if (
    activeClassroomId &&
    activeStudentId &&
    !classrooms[activeClassroomId].studentIds.includes(activeStudentId)
  ) {
    fail('دانش‌آموز فعال عضو کلاس فعال فایل پشتیبان نیست.');
  }

  return { activeClassroomId, activeStudentId, classrooms, teachers, students };
};

const canonicalStringify = (value: unknown): string => {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`)
    .join(',')}}`;
};

const sha256 = async (value: unknown): Promise<string> => {
  if (!globalThis.crypto?.subtle) {
    throw new BackupValidationError('مرورگر امکان بررسی امنیت فایل پشتیبان را ندارد.');
  }
  const bytes = new TextEncoder().encode(canonicalStringify(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
  return `sha256:${hash}`;
};

const getUnsignedBackup = (document: BackupDocument) => ({
  metadata: {
    appVersion: document.metadata.appVersion,
    exportedAt: document.metadata.exportedAt,
  },
  data: document.data,
});

export const createBackupDocument = async (): Promise<BackupDocument> => {
  const state = useHodhodakStore.getState();
  const exportedAt = new Date().toISOString();
  const data: BackupData = structuredClone({
    activeClassroomId: state.activeClassroomId,
    activeStudentId: state.activeStudentId,
    classrooms: state.classrooms,
    teachers: state.teachers,
    students: state.students,
  });
  const unsignedBackup: Omit<BackupDocument, 'metadata'> & {
    metadata: Omit<BackupMetadata, 'checksum'>;
  } = {
    metadata: { appVersion: APP_VERSION, exportedAt },
    data,
  };

  return {
    ...unsignedBackup,
    metadata: {
      ...unsignedBackup.metadata,
      checksum: await sha256(unsignedBackup),
    },
  };
};

export const exportBackupData = async (): Promise<BackupDocument> => {
  const backup = await createBackupDocument();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = backup.metadata.exportedAt.slice(0, 10).replaceAll('-', '_');
  link.href = url;
  link.download = `hodhodak_backup_${date}.json`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return backup;
};

export const parseBackupText = async (text: string): Promise<BackupDocument> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail('فایل انتخاب‌شده JSON معتبر نیست یا ناقص است.');
  }

  const root = requireRecord(parsed, 'root');
  const metadata = requireRecord(root.metadata, 'metadata');
  const appVersion = requireString(metadata.appVersion, 'metadata.appVersion');
  if (appVersion !== APP_VERSION) {
    fail(`نسخهٔ فایل پشتیبان (${appVersion}) با نسخهٔ فعلی برنامه سازگار نیست.`);
  }
  const exportedAt = requireIsoDate(metadata.exportedAt, 'metadata.exportedAt');
  const checksum = requireString(metadata.checksum, 'metadata.checksum');
  if (!/^sha256:[a-f0-9]{64}$/.test(checksum)) {
    fail('قالب کد صحت فایل پشتیبان معتبر نیست.');
  }

  const backup: BackupDocument = {
    metadata: { appVersion: APP_VERSION, exportedAt, checksum },
    data: validateBackupData(root.data),
  };
  const expectedChecksum = await sha256(getUnsignedBackup(backup));
  if (checksum !== expectedChecksum) {
    fail('محتوای فایل با کد صحت آن هماهنگ نیست؛ فایل ممکن است تغییر کرده یا ناقص باشد.');
  }
  return backup;
};

export const importBackupData = async (file: File): Promise<BackupDocument> => {
  if (!file) fail('لطفاً یک فایل پشتیبان انتخاب کنید.');
  if (file.size > MAX_BACKUP_SIZE_BYTES) {
    fail('حجم فایل پشتیبان بیشتر از ۱۰ مگابایت است.');
  }
  return parseBackupText(await file.text());
};

export const applyImportedBackup = (
  backup: BackupDocument,
  strategy: ImportStrategy,
): ImportResult => {
  const incoming = backup.data;
  const current = useHodhodakStore.getState();

  if (strategy === 'overwrite') {
    const activeStudent = incoming.activeStudentId
      ? incoming.students[incoming.activeStudentId]
      : undefined;
    useHodhodakStore.setState((state) => ({
      ...incoming,
      profile: activeStudent
        ? { ...state.profile, name: activeStudent.fullName, avatarId: activeStudent.avatar }
        : state.profile,
    }));
    return {
      strategy,
      classroomsAdded: Object.keys(incoming.classrooms).length,
      teachersAdded: Object.keys(incoming.teachers).length,
      studentsAdded: Object.keys(incoming.students).length,
      skippedDuplicates: 0,
    };
  }

  const newTeacherEntries = Object.entries(incoming.teachers).filter(
    ([id]) => !current.teachers[id],
  );
  const newStudentEntries = Object.entries(incoming.students).filter(
    ([id]) => !current.students[id],
  );
  const newClassroomEntries = Object.entries(incoming.classrooms).filter(
    ([id]) => !current.classrooms[id],
  );
  const teachers = { ...current.teachers, ...Object.fromEntries(newTeacherEntries) };
  const students = { ...current.students, ...Object.fromEntries(newStudentEntries) };
  const classrooms = { ...current.classrooms, ...Object.fromEntries(newClassroomEntries) };
  const activeClassroomId = current.activeClassroomId ?? incoming.activeClassroomId;
  const activeClassroom = activeClassroomId ? classrooms[activeClassroomId] : undefined;
  const preferredStudentId = current.activeStudentId ?? incoming.activeStudentId;
  const activeStudentId = activeClassroom
    ? activeClassroom.studentIds.includes(preferredStudentId ?? '')
      ? preferredStudentId
      : (activeClassroom.studentIds[0] ?? null)
    : preferredStudentId && students[preferredStudentId]
      ? preferredStudentId
      : null;
  const activeStudent = activeStudentId ? students[activeStudentId] : undefined;

  useHodhodakStore.setState((state) => ({
    teachers,
    students,
    classrooms,
    activeClassroomId,
    activeStudentId,
    profile: activeStudent
      ? { ...state.profile, name: activeStudent.fullName, avatarId: activeStudent.avatar }
      : state.profile,
  }));

  return {
    strategy,
    classroomsAdded: newClassroomEntries.length,
    teachersAdded: newTeacherEntries.length,
    studentsAdded: newStudentEntries.length,
    skippedDuplicates:
      Object.keys(incoming.classrooms).length - newClassroomEntries.length +
      (Object.keys(incoming.teachers).length - newTeacherEntries.length) +
      (Object.keys(incoming.students).length - newStudentEntries.length),
  };
};

export const getBackupErrorMessage = (error: unknown): string =>
  error instanceof BackupValidationError
    ? error.message
    : 'خطای پیش‌بینی‌نشده‌ای رخ داد. لطفاً دوباره تلاش کنید.';
