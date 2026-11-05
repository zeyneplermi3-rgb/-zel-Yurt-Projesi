import { redirect } from "next/navigation";

export default function SuperAdminPage() {
  redirect("/?role=superadmin");
}
