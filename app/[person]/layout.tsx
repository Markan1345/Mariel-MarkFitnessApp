import { notFound } from "next/navigation";
import { PERSON_IDS, isPersonId } from "@/lib/people";

export function generateStaticParams() {
  return PERSON_IDS.map((person) => ({ person }));
}

export default async function PersonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ person: string }>;
}) {
  const { person } = await params;
  if (!isPersonId(person)) notFound();
  return <>{children}</>;
}
