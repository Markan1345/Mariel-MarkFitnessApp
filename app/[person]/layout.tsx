import { notFound } from "next/navigation";
import { isPersonId } from "@/lib/people";

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
