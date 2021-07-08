import { Base } from './_Base';

class OutOfOfficeUsers extends Base {
	constructor() {
		super('OutOfOfficeUsers');
	}

	// insert
	createWithFullOutOfOfficeData(
		data: Omit<IOutOfOfficeUser, '_id'>,
	): Record<string, unknown> {
		return this.upsert({ userId: data.userId }, { ...data });
	}

	// find
	findOneByUserId(userId: IOutOfOfficeUser['userId'], options = {}): IOutOfOfficeUser {
		return this.findOne({ userId }, options);
	}

	findAllFromRoomId(roomId:string):IOutOfOfficeUser[]{
		return this.find({roomIds:{$in:[roomId]},sentRoomIds:{$nin:[roomId]}});
	}

	// update

	updateSentRoomIds(docId: IOutOfOfficeUser["_id"], roomId: string) {
		return this.update({ _id: docId }, { $push: { sentRoomIds: roomId } });
	  }

	setDisabled(userId: string): number {
		return this.update({ userId }, { $set: { isEnabled: false } });
	}
}

export interface IOutOfOfficeUser {
	_id: string;
	isEnabled: boolean;
	userId: string;
	roomIds: string[];
	customMessage: string;
	startDate: string;
	endDate: string;
}

export default new OutOfOfficeUsers();
