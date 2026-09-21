import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  AppState,
  Classroom,
  ClassroomChanges,
  CreateClassroomInput,
  CreateStudentInput,
  CreateTeacherInput,
  Student,
  StudentChanges,
  Teacher,
  TeacherChanges,
} from '../types/hodhodak';

export type {
  AppState,
  Classroom,
  CreateClassroomInput,
  CreateStudentInput,
  CreateTeacherInput,
  Student,
  Teacher,
} from '../types/hodhodak';

interface ProfileState {
  name: string;
  avatarId: string;
  onboarded: boolean;
}

interface GamificationState {
  seeds: number;
  level: number;
  levelProgress: number;
}

interface SettingsState {
  audioEnabled: boolean;
}

interface LessonState {
  lessonId: string | null;
  stepIndex: number;
  totalSteps: number;
  correctAnswers: number;
  mistakes: number;
  startedAt: string | null;
  completed: boolean;
}

interface LegacyAppState {
  profile: ProfileState;
  gamification: GamificationState;
  settings: SettingsState;
  lesson: LessonState;
}

interface StoreActions {
  createTeacher: (input: CreateTeacherInput) => Teacher;
  updateTeacher: (teacherId: string, changes: TeacherChanges) => boolean;
  deleteTeacher: (teacherId: string) => boolean;

  createStudent: (input: CreateStudentInput) => Student;
  updateStudent: (studentId: string, changes: StudentChanges) => boolean;
  deleteStudent: (studentId: string) => boolean;

  createClassroom: (input: CreateClassroomInput) => Classroom;
  updateClassroom: (classroomId: string, changes: ClassroomChanges) => boolean;
  deleteClassroom: (classroomId: string) => boolean;

  assignTeacherToClass: (classId: string, teacherId: string) => boolean;
  addStudentToClass: (classId: string, studentId: string) => boolean;
  removeStudentFromClass: (classId: string, studentId: string) => boolean;

  setActiveClass: (classId: string | null) => boolean;
  setActiveStudent: (studentId: string | null) => boolean;

  getActiveClass: () => Classroom | undefined;
  getActiveTeacher: () => Teacher | undefined;
  getActiveStudent: () => Student | undefined;
  getClassStudents: (classId: string) => Student[];

  setProfile: (profile: Partial<Pick<ProfileState, 'name' | 'avatarId'>>) => void;
  completeOnboarding: () => void;
  addSeeds: (amount: number) => GamificationState & { leveledUp?: boolean };
  toggleAudio: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  startLesson: (lessonId: string, totalSteps: number) => void;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  recordAnswer: (isCorrect: boolean) => void;
  completeLesson: (seedBonus?: number) => GamificationState & { leveledUp?: boolean };
  resetLesson: () => void;
  resetAll: () => void;
}

export type HodhodakStore = AppState & LegacyAppState & StoreActions;
type PersistedHodhodakState = AppState & LegacyAppState;

const SEED_CREATED_AT = '2026-09-21T00:00:00.000Z';

const seedTeachers: Record<string, Teacher> = {
  'teacher-mina': {
    id: 'teacher-mina',
    fullName: 'مینا احمدی',
    avatar: '👩‍🏫',
    bio: 'آموزگار پایهٔ اول با تمرکز بر یادگیری شاد و بازی‌محور',
    createdAt: SEED_CREATED_AT,
  },
};

const seedStudents: Record<string, Student> = {
  'student-sara': {
    id: 'student-sara',
    fullName: 'سارا محمدی',
    avatar: '👧',
    birthYear: 1398,
    progress: {},
    createdAt: SEED_CREATED_AT,
  },
  'student-ali': {
    id: 'student-ali',
    fullName: 'علی رضایی',
    avatar: '👦',
    birthYear: 1398,
    progress: {},
    createdAt: SEED_CREATED_AT,
  },
  'student-nika': {
    id: 'student-nika',
    fullName: 'نیکا کریمی',
    avatar: '🧒',
    birthYear: 1397,
    progress: {},
    createdAt: SEED_CREATED_AT,
  },
};

const seedClassrooms: Record<string, Classroom> = {
  'class-grade-1-a': {
    id: 'class-grade-1-a',
    name: 'کلاس اول الف',
    gradeLevel: 1,
    academicYear: '۱۴۰۵–۱۴۰۶',
    teacherId: 'teacher-mina',
    studentIds: ['student-sara', 'student-ali', 'student-nika'],
    createdAt: SEED_CREATED_AT,
  },
};

const initialLesson: LessonState = {
  lessonId: null,
  stepIndex: 0,
  totalSteps: 0,
  correctAnswers: 0,
  mistakes: 0,
  startedAt: null,
  completed: false,
};

const createInitialState = (): PersistedHodhodakState => ({
  activeClassroomId: 'class-grade-1-a',
  activeStudentId: 'student-sara',
  classrooms: structuredClone(seedClassrooms),
  teachers: structuredClone(seedTeachers),
  students: structuredClone(seedStudents),
  profile: {
    name: seedStudents['student-sara'].fullName,
    avatarId: seedStudents['student-sara'].avatar,
    onboarded: true,
  },
  gamification: {
    seeds: 0,
    level: 1,
    levelProgress: 0,
  },
  settings: {
    audioEnabled: true,
  },
  lesson: { ...initialLesson },
});

const createId = (prefix: string): string => {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${randomId}`;
};

const createEntity = <T extends { id: string; createdAt: string }>(
  input: Omit<T, 'id' | 'createdAt'> & Partial<Pick<T, 'id' | 'createdAt'>>,
  prefix: string,
): T =>
  ({
    ...input,
    id: input.id ?? createId(prefix),
    createdAt: input.createdAt ?? new Date().toISOString(),
  }) as T;

const ensureUniqueId = (collection: Record<string, unknown>, id: string): void => {
  if (collection[id]) {
    throw new Error(`An entity with id "${id}" already exists.`);
  }
};

const getProfileForStudent = (
  student: Student | undefined,
  currentProfile: ProfileState,
): ProfileState =>
  student
    ? { ...currentProfile, name: student.fullName, avatarId: student.avatar }
    : currentProfile;

export const seedsForNextLevel = (level: number): number => level * 100;

export const useHodhodakStore = create<HodhodakStore>()(
  persist<HodhodakStore, [], [], PersistedHodhodakState>(
    (set, get) => ({
      ...createInitialState(),

      createTeacher: (input) => {
        const teacher = createEntity<Teacher>(input, 'teacher');
        ensureUniqueId(get().teachers, teacher.id);
        set((state) => ({ teachers: { ...state.teachers, [teacher.id]: teacher } }));
        return teacher;
      },

      updateTeacher: (teacherId, changes) => {
        if (!get().teachers[teacherId]) return false;
        set((state) => ({
          teachers: {
            ...state.teachers,
            [teacherId]: { ...state.teachers[teacherId], ...changes },
          },
        }));
        return true;
      },

      deleteTeacher: (teacherId) => {
        const state = get();
        if (!state.teachers[teacherId]) return false;
        if (Object.values(state.classrooms).some((classroom) => classroom.teacherId === teacherId)) {
          return false;
        }
        set((current) => {
          const teachers = { ...current.teachers };
          delete teachers[teacherId];
          return { teachers };
        });
        return true;
      },

      createStudent: (input) => {
        const student = createEntity<Student>(input, 'student');
        ensureUniqueId(get().students, student.id);
        set((state) => ({ students: { ...state.students, [student.id]: student } }));
        return student;
      },

      updateStudent: (studentId, changes) => {
        if (!get().students[studentId]) return false;
        set((state) => {
          const student = { ...state.students[studentId], ...changes };
          return {
            students: { ...state.students, [studentId]: student },
            profile:
              state.activeStudentId === studentId
                ? getProfileForStudent(student, state.profile)
                : state.profile,
          };
        });
        return true;
      },

      deleteStudent: (studentId) => {
        if (!get().students[studentId]) return false;
        set((state) => {
          const students = { ...state.students };
          delete students[studentId];

          const classrooms = Object.fromEntries(
            Object.entries(state.classrooms).map(([id, classroom]) => [
              id,
              {
                ...classroom,
                studentIds: classroom.studentIds.filter((id) => id !== studentId),
              },
            ]),
          );

          const activeClassroom = state.activeClassroomId
            ? classrooms[state.activeClassroomId]
            : undefined;
          const activeStudentId =
            state.activeStudentId === studentId
              ? (activeClassroom?.studentIds[0] ?? null)
              : state.activeStudentId;

          return {
            students,
            classrooms,
            activeStudentId,
            profile: getProfileForStudent(
              activeStudentId ? students[activeStudentId] : undefined,
              state.profile,
            ),
          };
        });
        return true;
      },

      createClassroom: (input) => {
        const state = get();
        if (!state.teachers[input.teacherId]) {
          throw new Error(`Teacher "${input.teacherId}" does not exist.`);
        }
        if (input.studentIds.some((studentId) => !state.students[studentId])) {
          throw new Error('Every classroom student must exist before assignment.');
        }

        const classroom = createEntity<Classroom>(
          {
            ...input,
            gradeLevel: 1,
            studentIds: [...new Set(input.studentIds)],
          },
          'class',
        );
        ensureUniqueId(state.classrooms, classroom.id);
        set((current) => ({
          classrooms: { ...current.classrooms, [classroom.id]: classroom },
        }));
        return classroom;
      },

      updateClassroom: (classroomId, changes) => {
        const state = get();
        if (!state.classrooms[classroomId]) return false;
        if (changes.teacherId && !state.teachers[changes.teacherId]) return false;
        if (changes.studentIds?.some((studentId) => !state.students[studentId])) return false;

        set((current) => {
          const classroom = {
            ...current.classrooms[classroomId],
            ...changes,
            gradeLevel: 1 as const,
            ...(changes.studentIds && { studentIds: [...new Set(changes.studentIds)] }),
          };
          const activeStudentId =
            current.activeClassroomId === classroomId &&
            current.activeStudentId &&
            !classroom.studentIds.includes(current.activeStudentId)
              ? (classroom.studentIds[0] ?? null)
              : current.activeStudentId;

          return {
            classrooms: { ...current.classrooms, [classroomId]: classroom },
            activeStudentId,
            profile: getProfileForStudent(
              activeStudentId ? current.students[activeStudentId] : undefined,
              current.profile,
            ),
          };
        });
        return true;
      },

      deleteClassroom: (classroomId) => {
        if (!get().classrooms[classroomId]) return false;
        set((state) => {
          const classrooms = { ...state.classrooms };
          delete classrooms[classroomId];
          const isActive = state.activeClassroomId === classroomId;
          return {
            classrooms,
            activeClassroomId: isActive ? null : state.activeClassroomId,
            activeStudentId: isActive ? null : state.activeStudentId,
          };
        });
        return true;
      },

      assignTeacherToClass: (classId, teacherId) => {
        const state = get();
        if (!state.classrooms[classId] || !state.teachers[teacherId]) return false;
        set((current) => ({
          classrooms: {
            ...current.classrooms,
            [classId]: { ...current.classrooms[classId], teacherId },
          },
        }));
        return true;
      },

      addStudentToClass: (classId, studentId) => {
        const state = get();
        const classroom = state.classrooms[classId];
        if (!classroom || !state.students[studentId]) return false;
        if (classroom.studentIds.includes(studentId)) return true;
        set((current) => ({
          classrooms: {
            ...current.classrooms,
            [classId]: {
              ...current.classrooms[classId],
              studentIds: [...current.classrooms[classId].studentIds, studentId],
            },
          },
        }));
        return true;
      },

      removeStudentFromClass: (classId, studentId) => {
        const state = get();
        const classroom = state.classrooms[classId];
        if (!classroom || !classroom.studentIds.includes(studentId)) return false;
        set((current) => {
          const studentIds = current.classrooms[classId].studentIds.filter(
            (id) => id !== studentId,
          );
          const shouldSwitchStudent =
            current.activeClassroomId === classId && current.activeStudentId === studentId;
          const activeStudentId = shouldSwitchStudent
            ? (studentIds[0] ?? null)
            : current.activeStudentId;
          return {
            classrooms: {
              ...current.classrooms,
              [classId]: { ...current.classrooms[classId], studentIds },
            },
            activeStudentId,
            profile: getProfileForStudent(
              activeStudentId ? current.students[activeStudentId] : undefined,
              current.profile,
            ),
          };
        });
        return true;
      },

      setActiveClass: (classId) => {
        if (classId !== null && !get().classrooms[classId]) return false;
        set((state) => {
          const classroom = classId ? state.classrooms[classId] : undefined;
          const activeStudentId = classroom
            ? classroom.studentIds.includes(state.activeStudentId ?? '')
              ? state.activeStudentId
              : (classroom.studentIds[0] ?? null)
            : null;
          return {
            activeClassroomId: classId,
            activeStudentId,
            profile: getProfileForStudent(
              activeStudentId ? state.students[activeStudentId] : undefined,
              state.profile,
            ),
          };
        });
        return true;
      },

      setActiveStudent: (studentId) => {
        const state = get();
        if (studentId === null) {
          set({ activeStudentId: null });
          return true;
        }
        if (!state.students[studentId]) return false;
        const activeClassroom = state.activeClassroomId
          ? state.classrooms[state.activeClassroomId]
          : undefined;
        if (activeClassroom && !activeClassroom.studentIds.includes(studentId)) return false;
        set({
          activeStudentId: studentId,
          profile: getProfileForStudent(state.students[studentId], state.profile),
        });
        return true;
      },

      getActiveClass: () => {
        const state = get();
        return state.activeClassroomId ? state.classrooms[state.activeClassroomId] : undefined;
      },

      getActiveTeacher: () => {
        const state = get();
        const classroom = state.activeClassroomId
          ? state.classrooms[state.activeClassroomId]
          : undefined;
        return classroom ? state.teachers[classroom.teacherId] : undefined;
      },

      getActiveStudent: () => {
        const state = get();
        return state.activeStudentId ? state.students[state.activeStudentId] : undefined;
      },

      getClassStudents: (classId) => {
        const state = get();
        return (state.classrooms[classId]?.studentIds ?? [])
          .map((studentId) => state.students[studentId])
          .filter((student): student is Student => Boolean(student));
      },

      setProfile: (profile) =>
        set((state) => ({ profile: { ...state.profile, ...profile } })),

      completeOnboarding: () =>
        set((state) => ({ profile: { ...state.profile, onboarded: true } })),

      addSeeds: (amount) => {
        if (amount <= 0) return get().gamification;
        const { seeds, level, levelProgress } = get().gamification;
        let newLevel = level;
        let newProgress = levelProgress + amount;
        while (newProgress >= seedsForNextLevel(newLevel)) {
          newProgress -= seedsForNextLevel(newLevel);
          newLevel += 1;
        }
        const gamification = {
          seeds: seeds + amount,
          level: newLevel,
          levelProgress: newProgress,
        };
        set({ gamification });
        return { ...gamification, leveledUp: newLevel > level };
      },

      toggleAudio: () =>
        set((state) => ({
          settings: { ...state.settings, audioEnabled: !state.settings.audioEnabled },
        })),

      setAudioEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, audioEnabled: enabled } })),

      startLesson: (lessonId, totalSteps) =>
        set({
          lesson: {
            lessonId,
            stepIndex: 0,
            totalSteps,
            correctAnswers: 0,
            mistakes: 0,
            startedAt: new Date().toISOString(),
            completed: false,
          },
        }),

      goToStep: (stepIndex) =>
        set((state) => ({
          lesson: {
            ...state.lesson,
            stepIndex: Math.max(0, Math.min(stepIndex, state.lesson.totalSteps - 1)),
          },
        })),

      nextStep: () => {
        const { lesson } = get();
        if (lesson.stepIndex < lesson.totalSteps - 1) {
          set({ lesson: { ...lesson, stepIndex: lesson.stepIndex + 1 } });
        }
      },

      recordAnswer: (isCorrect) =>
        set((state) => ({
          lesson: {
            ...state.lesson,
            correctAnswers: state.lesson.correctAnswers + (isCorrect ? 1 : 0),
            mistakes: state.lesson.mistakes + (isCorrect ? 0 : 1),
          },
        })),

      completeLesson: (seedBonus = 20) => {
        set((state) => ({ lesson: { ...state.lesson, completed: true } }));
        return get().addSeeds(seedBonus);
      },

      resetLesson: () => set({ lesson: { ...initialLesson } }),
      resetAll: () => set(createInitialState()),
    }),
    {
      name: 'hodhodak-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeClassroomId: state.activeClassroomId,
        activeStudentId: state.activeStudentId,
        classrooms: state.classrooms,
        teachers: state.teachers,
        students: state.students,
        profile: state.profile,
        gamification: state.gamification,
        settings: state.settings,
        lesson: state.lesson,
      }),
      migrate: (persistedState) => {
        const defaults = createInitialState();
        const persisted = persistedState as Partial<PersistedHodhodakState>;
        return {
          ...defaults,
          ...persisted,
          classrooms: persisted.classrooms ?? defaults.classrooms,
          teachers: persisted.teachers ?? defaults.teachers,
          students: persisted.students ?? defaults.students,
          profile: { ...defaults.profile, ...persisted.profile },
          gamification: { ...defaults.gamification, ...persisted.gamification },
          settings: { ...defaults.settings, ...persisted.settings },
          lesson: { ...defaults.lesson, ...persisted.lesson },
        };
      },
    },
  ),
);

export const selectActiveClass = (state: HodhodakStore): Classroom | undefined =>
  state.activeClassroomId ? state.classrooms[state.activeClassroomId] : undefined;

export const selectActiveTeacher = (state: HodhodakStore): Teacher | undefined => {
  const classroom = selectActiveClass(state);
  return classroom ? state.teachers[classroom.teacherId] : undefined;
};

export const selectActiveStudent = (state: HodhodakStore): Student | undefined =>
  state.activeStudentId ? state.students[state.activeStudentId] : undefined;

export const selectClassStudents =
  (classId: string) =>
  (state: HodhodakStore): Student[] =>
    (state.classrooms[classId]?.studentIds ?? [])
      .map((studentId) => state.students[studentId])
      .filter((student): student is Student => Boolean(student));

export const selectProfile = (state: HodhodakStore) => state.profile;
export const selectGamification = (state: HodhodakStore) => state.gamification;
export const selectAudioEnabled = (state: HodhodakStore) => state.settings.audioEnabled;
export const selectLesson = (state: HodhodakStore) => state.lesson;
export const selectLevelPercent = (state: HodhodakStore): number =>
  Math.round(
    (state.gamification.levelProgress / seedsForNextLevel(state.gamification.level)) * 100,
  );

export default useHodhodakStore;
