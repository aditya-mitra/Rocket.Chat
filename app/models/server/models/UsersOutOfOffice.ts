import { Base } from "./_Base";

class UsersOutOfOffice extends Base {
  constructor() {
    super("users_out_of_office");

    this.tryEnsureIndex({ userId: 1 }, { unique: true });
    this.tryEnsureIndex({ deputyId: 1 });
    this.tryEnsureIndex({ roomIds: 1 });
    // store user's custom message
    // store if deputy was already added in the room
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
    const doc = this.findOne({ userId }, { fields: { roomIds: 1 } });
    return doc && doc.roomIds ? doc.roomIds : [];
  }

  getOutOfOfficeRoomsAndDeputy(
    userId: string
  ): { roomIds: string[]; deputyId: string } {
    const doc = this.findOne(
      { userId },
      { fields: { roomIds: 1, deputyId: 1 } }
    );

    return {
      roomIds: doc.roomIds,
      deputyId: doc.deputyId,
    };
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

  removeUserOutOfOffice(userId: string) {
    const doc = this.findOne({ userId });
    return this.remove(doc._id);
  }
}

export default new UsersOutOfOffice();
