import { Base } from "./_Base";

class UsersOutOfOffice extends Base {
  constructor() {
    super("users_out_of_office");

    // aditya-todo change the model to contain:
    //  username, name, and _id of the oof user
    //  username, name and _di of the deputy
    // no need to ensure the index of all, just store the type in the interface IOutOfOfficeModel
    this.tryEnsureIndex({ userId: 1 }, { unique: true });
    this.tryEnsureIndex({ deputyId: 1 });
    this.tryEnsureIndex({ roomIds: 1 });
    // store user's custom message. also check that the user did not do a mention in his custom message
    // store if deputy was already added in the room. 
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

  getDocumentFromUserId(userId: string): IOutOfOfficeModel {
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

  getUsersAndDeputysFromUserIds(
    userIds: string[]
  ): Pick<IOutOfOfficeModel, "_id" | "userId" | "deputyId">[] {
    const query = {
      userId: { $in: userIds },
    };

    const project = {
      userId: 1,
      deputyId: 1,
    };

    const cursor = this.find(query, project);

    const users = Promise.await(cursor.fetch());

    return users;
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

interface IOutOfOfficeModel {
  _id: string;
  userId: string;
  deputyId: string;
  rooms: string[];
}

export default new UsersOutOfOffice();
