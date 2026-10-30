import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PublicCourseEnrollForm } from "@/components/shop/PublicCourseEnrollForm";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getBrandForRequest } from "@/lib/brand/server";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [dict, brand] = await Promise.all([getDictionary(locale), getBrandForRequest()]);
  return buildResolvedPublicShareMetadata({
    what: dict.shop.catalog.coursesTitle,
    academyName: brand.name,
    description: dict.shop.catalog.lead,
    path: `/${locale}/tienda/curso/${slug}`,
  });
}

export default async function PublicCoursePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("learning_courses")
    .select("id, title, price, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("listed_in_shop", true)
    .maybeSingle();
  if (!course) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role: "student" | "parent" | "other" = "other";
  let wards: { id: string; name: string }[] = [];
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const raw = String(profile?.role ?? "");
    role = raw === "student" ? "student" : raw === "parent" || raw === "tutor" ? "parent" : "other";
    if (role === "parent") {
      const { data: links } = await supabase.from("tutor_student_rel").select("student_id").eq("tutor_id", user.id);
      const ids = (links ?? []).map((row) => String(row.student_id));
      if (ids.length > 0) {
        const { data: people } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
        wards = (people ?? []).map((person) => ({
          id: String(person.id),
          name: formatProfileNameSurnameFirst(person.first_name, person.last_name),
        }));
      }
    }
  }

  const { currency } = await loadBillingCurrencySetting(supabase);
  const price = Number(course.price);
  const priceLabel = new Intl.NumberFormat(locale, { style: "currency", currency }).format(price);

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <Link
        href={`/${locale}/tienda`}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {dict.shop.course.back}
      </Link>
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">{course.title}</h1>
        <p className="text-lg text-[var(--color-foreground)]">{priceLabel}</p>
      </header>
      <PublicCourseEnrollForm
        locale={locale}
        slug={String(course.slug)}
        price={price}
        signedIn={Boolean(user)}
        role={role}
        wards={wards}
        labels={dict.shop.course}
      />
    </main>
  );
}
