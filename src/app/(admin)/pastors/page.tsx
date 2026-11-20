import { redirect } from "next/navigation";

export default function PastorsPage() {
  redirect("/churches?tab=pasteurs");
}
