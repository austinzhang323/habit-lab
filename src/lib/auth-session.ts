import type { Session } from "next-auth";
import type { User } from "next-auth";

export function attachUserIdToSession(
  session: Session,
  user: Pick<User, "id">
): Session {
  if (session.user) {
    session.user.id = user.id;
  }
  return session;
}
