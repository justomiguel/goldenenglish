export type CourseOrigin = "section" | "purchase" | "assignment";

export type CourseProgressMode = "open" | "sequential";

export type StudentCourseLesson = {
  id: string;
  title: string;
  unlocked: boolean;
  completed: boolean;
};

export type StudentCourseModule = {
  id: string;
  title: string;
  lessons: StudentCourseLesson[];
};

export type StudentCourseCard = {
  id: string;
  title: string;
  origins: CourseOrigin[];
  progressMode: CourseProgressMode;
  modules: StudentCourseModule[];
};
