import type { SupabaseClient } from "@supabase/supabase-js";
import { assembleStudentCourses, type CourseAssemblyRow } from "@/lib/courses/assembleStudentCourses";
import type { CourseProgressMode } from "@/lib/courses/lessonUnlock";
import { noteReadFailure, type LoadErrorReporter } from "@/lib/logging/noteReadFailure";
import type { StudentCourseCard } from "@/types/studentCourses";

const SCOPE = "loadStudentCourses";

type EnrollmentRow = { section_id: string };
type GrantRow = { course_id: string; source: "admin" | "purchase" };
type AssignmentRow = { section_id: string; course_id: string };
type RouteRow = { section_id: string; learning_route_id: string | null };
type RouteCourseRow = { learning_route_id: string; course_id: string };
type CourseRow = { id: string; title: string; status: "draft" | "published"; progress_mode: CourseProgressMode };
type ModuleRow = { id: string; course_id: string; title: string; sort_order: number };
type LessonRow = { id: string; module_id: string; title: string; sort_order: number };
type ProgressRow = { lesson_id: string };

function addGrant(map: Map<string, Set<string>>, courseId: string, sectionId: string) {
  const current = map.get(courseId) ?? new Set<string>();
  current.add(sectionId);
  map.set(courseId, current);
}

export async function loadStudentCourses(
  supabase: SupabaseClient,
  studentId: string,
  onLoadError?: LoadErrorReporter,
): Promise<StudentCourseCard[]> {
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("section_enrollments")
    .select("section_id")
    .eq("student_id", studentId)
    .eq("status", "active");
  noteReadFailure(`${SCOPE}:enrollments`, enrollmentError, { studentId }, onLoadError);
  if (enrollmentError) return [];

  const sectionIds = ((enrollmentData ?? []) as EnrollmentRow[]).map((row) => row.section_id);
  const { data: grantData, error: grantError } = await supabase
    .from("student_course_grants")
    .select("course_id, source")
    .eq("student_id", studentId);
  noteReadFailure(`${SCOPE}:grants`, grantError, { studentId }, onLoadError);
  if (grantError) return [];

  const grants = (grantData ?? []) as GrantRow[];
  const assignmentQuery = sectionIds.length
    ? supabase.from("section_course_assignments").select("section_id, course_id").in("section_id", sectionIds)
    : Promise.resolve({ data: [], error: null });
  const routeQuery = sectionIds.length
    ? supabase
        .from("section_learning_routes")
        .select("section_id, learning_route_id")
        .in("section_id", sectionIds)
        .eq("mode", "route")
    : Promise.resolve({ data: [], error: null });

  const [assignmentsResult, routesResult] = await Promise.all([assignmentQuery, routeQuery]);
  noteReadFailure(`${SCOPE}:assignments`, assignmentsResult.error, { studentId }, onLoadError);
  noteReadFailure(`${SCOPE}:routes`, routesResult.error, { studentId }, onLoadError);
  if (assignmentsResult.error || routesResult.error) return [];

  const routes = ((routesResult.data ?? []) as RouteRow[]).filter(
    (row): row is { section_id: string; learning_route_id: string } => Boolean(row.learning_route_id),
  );
  const routeIds = [...new Set(routes.map((row) => row.learning_route_id))];
  const { data: routeCourseData, error: routeCourseError } = routeIds.length
    ? await supabase.from("learning_route_courses").select("learning_route_id, course_id").in("learning_route_id", routeIds)
    : { data: [], error: null };
  noteReadFailure(`${SCOPE}:routeCourses`, routeCourseError, { studentId }, onLoadError);
  if (routeCourseError) return [];

  const granting = new Map<string, Set<string>>();
  for (const row of (assignmentsResult.data ?? []) as AssignmentRow[]) {
    addGrant(granting, row.course_id, row.section_id);
  }
  const coursesByRoute = new Map<string, string[]>();
  for (const row of (routeCourseData ?? []) as RouteCourseRow[]) {
    const list = coursesByRoute.get(row.learning_route_id) ?? [];
    list.push(row.course_id);
    coursesByRoute.set(row.learning_route_id, list);
  }
  for (const route of routes) {
    for (const courseId of coursesByRoute.get(route.learning_route_id) ?? []) {
      addGrant(granting, courseId, route.section_id);
    }
  }

  const courseIds = [
    ...new Set([...granting.keys(), ...grants.map((row) => row.course_id)]),
  ];
  if (courseIds.length === 0) return [];

  const { data: courseData, error: courseError } = await supabase
    .from("learning_courses")
    .select("id, title, status, progress_mode")
    .in("id", courseIds);
  noteReadFailure(`${SCOPE}:courses`, courseError, { studentId }, onLoadError);
  if (courseError) return [];

  const courses = (courseData ?? []) as CourseRow[];
  const publishedIds = courses.filter((row) => row.status === "published").map((row) => row.id);
  if (publishedIds.length === 0) return [];

  const { data: moduleData, error: moduleError } = await supabase
    .from("course_modules")
    .select("id, course_id, title, sort_order")
    .in("course_id", publishedIds);
  noteReadFailure(`${SCOPE}:modules`, moduleError, { studentId }, onLoadError);
  if (moduleError) return [];

  const modules = (moduleData ?? []) as ModuleRow[];
  const moduleIds = modules.map((row) => row.id);
  const lessonResult = moduleIds.length
    ? await supabase.from("course_lessons").select("id, module_id, title, sort_order").in("module_id", moduleIds)
    : { data: [] as LessonRow[], error: null };
  noteReadFailure(`${SCOPE}:lessons`, lessonResult.error, { studentId }, onLoadError);
  if (lessonResult.error) return [];

  const lessons = (lessonResult.data ?? []) as LessonRow[];
  const lessonIds = lessons.map((row) => row.id);
  const progressResult = lessonIds.length
    ? await supabase.from("course_lesson_progress").select("lesson_id").eq("student_id", studentId).in("lesson_id", lessonIds)
    : { data: [] as ProgressRow[], error: null };
  noteReadFailure(`${SCOPE}:progress`, progressResult.error, { studentId }, onLoadError);
  if (progressResult.error) return [];

  const completed = new Set(((progressResult.data ?? []) as ProgressRow[]).map((row) => row.lesson_id));
  const grantByCourse = new Map(grants.map((row) => [row.course_id, row.source]));
  const rows: CourseAssemblyRow[] = courses.map((course) => ({
    id: course.id,
    title: course.title,
    published: course.status === "published",
    progressMode: course.progress_mode,
    grantingSectionIds: [...(granting.get(course.id) ?? [])],
    personalGrant: grantByCourse.get(course.id) === "purchase"
      ? "purchase"
      : grantByCourse.get(course.id) === "admin"
        ? "assignment"
        : null,
    modules: modules
      .filter((module) => module.course_id === course.id)
      .map((module) => ({
        id: module.id,
        title: module.title,
        sortOrder: module.sort_order,
        lessons: lessons
          .filter((lesson) => lesson.module_id === module.id)
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            sortOrder: lesson.sort_order,
            completed: completed.has(lesson.id),
          })),
      })),
  }));

  return assembleStudentCourses({
    courses: rows,
    activeEnrollmentSectionIds: sectionIds,
  });
}
