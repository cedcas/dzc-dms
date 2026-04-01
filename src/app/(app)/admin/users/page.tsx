import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  PAGE_TITLE, PAGE_SUBTITLE, PAGE_HEADER,
  TABLE_WRAPPER, TABLE_TH, TABLE_TR, TABLE_TD, TABLE_EMPTY_TD,
  PILL, PILL_GREEN, PILL_GRAY, PILL_BLUE, PILL_ORANGE, PILL_PURPLE,
  LINK_SUBTLE,
} from "@/lib/ui-classes";

export const metadata = { title: "User Administration — DZC DMS" };

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  NEGOTIATOR: "Negotiator",
  INTAKE: "Intake",
  READ_ONLY: "Read Only",
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: PILL_ORANGE,
  NEGOTIATOR: PILL_BLUE,
  INTAKE: PILL_PURPLE,
  READ_ONLY: PILL_GRAY,
};

export default async function UsersAdminPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className={PAGE_HEADER}>
        <div>
          <h1 className={PAGE_TITLE}>User Administration</h1>
          <p className={PAGE_SUBTITLE}>{users.length} user{users.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/admin/users/new" className={buttonVariants({ size: "sm" })}>
          + New User
        </Link>
      </div>

      <div className={TABLE_WRAPPER}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className={TABLE_TH}>Name</th>
              <th className={TABLE_TH}>Email</th>
              <th className={TABLE_TH}>Role</th>
              <th className={TABLE_TH}>Status</th>
              <th className={TABLE_TH}>Created</th>
              <th className={TABLE_TH}></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className={TABLE_EMPTY_TD}>No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={TABLE_TR}>
                  <td className={TABLE_TD}>
                    <span className="font-medium">{user.name}</span>
                  </td>
                  <td className={TABLE_TD}>{user.email}</td>
                  <td className={TABLE_TD}>
                    <span className={`${PILL} ${ROLE_BADGE[user.role] ?? PILL_GRAY}`}>
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className={TABLE_TD}>
                    <span className={`${PILL} ${user.isActive ? PILL_GREEN : PILL_GRAY}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={TABLE_TD}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className={TABLE_TD}>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className={`text-xs ${LINK_SUBTLE} text-primary`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
