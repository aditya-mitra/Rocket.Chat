import { OutOfOffice } from "../../models/server";

export function isUserOutOfOffice(userId: string): boolean {
  const doc = OutOfOffice.getDocumentFromUserId(userId);
  if (!doc) {
    return false;
  }
  return doc.userId == userId;
}
