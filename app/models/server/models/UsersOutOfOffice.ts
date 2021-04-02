import { Base } from "./_Base";

class UsersOutOfOffice extends Base {
  constructor() {
    super("users_out_of_office");

    // discuss later
    //  username, name, and _id of the oof user
    //  username, name and _id of the deputy
    //  BUT these are subject to change like renaming
    // no need to ensure the index of all, just store the type in the interface IOutOfOfficeModel
    this.tryEnsureIndex({ userId: 1 }, { unique: true });
    this.tryEnsureIndex({ deputyId: 1 });
    this.tryEnsureIndex({ roomIds: 1 });
  }

  // create

  createUserOutOfOffice({
    userId,
    deputyId,
    roomIds,
    customMessage,
    deputyPresentRoomIds,
    mentionedUserIds = [],
    sentRoomIds = [],
  }: Omit<IOutOfOfficeModel, "_id">) {
    const data = {
      userId,
      deputyId,
      roomIds,
      customMessage,
      deputyPresentRoomIds,
      mentionedUserIds,
      sentRoomIds,
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

  getDeputyAndCustomMessage(
    userId: string
  ): Pick<IOutOfOfficeModel, "_id" | "deputyId" | "customMessage"> {
    return this.findOne(
      { userId },
      { fields: { deputyId: 1, customMessage: 1 } }
    );
  }

  getDocsFromRoomId(roomId: string): IOutOfOfficeModel[] {
    // can be refactored into an aggregation
    return this.find({ roomIds: { $elemMatch: { $eq: roomId } } });
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

  updateMentionedUserIds(
    docId: IOutOfOfficeModel["_id"],
    mentioningUserId: string
  ) {
    return this.update(
      { _id: docId },
      { $push: { mentionedUserIds: mentioningUserId } }
    );
  }

  updateSentRoomIds(docId: IOutOfOfficeModel["_id"], roomId: string) {
    return this.update({ _id: docId }, { $push: { sentRoomIds: roomId } });
  }

  // destroy

  removeUserOutOfOffice(userId: string) {
    const doc = this.findOne({ userId });
    return this.remove(doc._id);
  }
}

export interface IOutOfOfficeModel {
  _id: string;
  userId: string;
  deputyId: string;
  roomIds: string[];
  customMessage: string;
  deputyPresentRoomIds: string[];
  mentionedUserIds: string[];
  sentRoomIds: string[];
}

export default new UsersOutOfOffice();
