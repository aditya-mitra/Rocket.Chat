import { Base } from "./_Base";

class UsersOutOfOffice extends Base {
  constructor() {
    super("users_out_of_office");

    this.tryEnsureIndex({ userId: 1 }, { unique: true });
    this.tryEnsureIndex({ deputyId: 1 });
    this.tryEnsureIndex({ roomIds: 1 });
    // user's custom message
  }

  // create
  createUserOutOfOffice(userId: string, deputyId: string, roomIds: string[]) {
    const data = {
      userId,
      deputyId,
      roomIds,
    };

    return this.insert(data);
  }

  // read

  getDocumentFromUserId(userId: string): Record<string, unknown> {
    return this.findOne({ userId });
  }

  getOutOfOfficeRooms(userId: string): string[] {
    return this.findOne({ userId }, { fields: { roomIds: 1 } });
  }

  // update

  updateUserOutOfOffice(docId: string, deputyId: string, roomIds: string[]) {
    return this.update(
      {
        _id: docId,
      },
      {
        $set: {
          deputyId,
          roomIds,
        },
      }
    );
  }

  // destroy

  /**
   * remove a document
   * the `getDocumentFromUserId` function first to get it
   * @param _id id of the document to be removed
   */
  removeUserOutOfOffice(_id: string) {
    return this.remove(_id);
  }
}

export default new UsersOutOfOffice();
