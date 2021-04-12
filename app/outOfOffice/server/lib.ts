import { OutOfOffice } from "../../models/server";

export function isUserOutOfOffice(userId: string): boolean {
  const doc = OutOfOffice.getDocumentFromUserId(userId);
  if (!doc) {
    return false;
  }
  return doc.userId == userId;
}

// createDirectMessage is a Meteor method use it to get the room if it exists else create a new