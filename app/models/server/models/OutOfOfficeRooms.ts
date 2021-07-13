import { Base } from './_Base';

class OutOfOfficeRooms extends Base {
	constructor() {
		super('OutOfOfficeRooms');
	}

	// insert
	addUserIdAndRoomId({
		roomId,
		userId,
	}: {
		roomId: string;
		userId: string;
	}): Record<string, unknown> {
		return this.upsert(
			{ roomId },
			{ $set: { roomId }, $addToSet: { userIds: userId } },
		);
	}

	// update
	/**update all the documents by removing the userId from the `userIds` array */
	updateAllHavingUserId(userId:string,roomIds:string[],){
		return this.update({roomId:{$in:roomIds}},{$pull:{userIds:userId}},{multi:true})
	}

	// remove

	removeById(_id: string): Record<string, unknown> {
		return this.remove({ _id });
	}
}

export interface IOutOfOfficeRoom {
	_id: string;
	roomId: string;
	userIds: string[];
}

export default new OutOfOfficeRooms();
