import { Base } from "./_Base";

class UsersOutOfOffice extends Base {
  constructor() {
    super("users_out_of_office");

    // aditya-todo change the model to contain:
    //  username, name, and _id of the oof user
    //  username, name and _id of the deputy
    // no need to ensure the index of all, just store the type in the interface IOutOfOfficeModel
    this.tryEnsureIndex({ userId: 1 }, { unique: true });
    this.tryEnsureIndex({ deputyId: 1 });
    this.tryEnsureIndex({ roomIds: 1 });
    // store user's custom message. also check that the user did not do a mention in his custom message
    // store user's custom message
    // store if deputy was already added in the room
    // store if user was already mentioned in the main channel
  }

  // create

  createUserOutOfOffice({
    userId,
    deputyId,
    roomIds,
    customMessage,
  }: Omit<IOutOfOfficeModel, "_id">) {
    const data = {
      userId,
      deputyId,
      roomIds,
      customMessage,
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

  getDeputyAndCustomMessage(
    userId: string
  ): Pick<IOutOfOfficeModel, "_id" | "deputyId" | "customMessage"> {
    return this.findOne(
      { userId },
      { fields: { deputyId: 1, customMessage: 1 } }
    );
  }

  // update

  updateUserOutOfOffice(
    docId: string,
    { deputyId, roomIds }: Omit<IOutOfOfficeModel, "_id" | "userId">
  ) {
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
  roomIds: string[];
  customMessage: string;
}

export default new UsersOutOfOffice();
