import { Meteor } from 'meteor/meteor';
import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';

import { OutOfOfficeUsers,OutOfOfficeRooms } from '../../models/server';

interface IScheduleEnable {
	userId:string;
	when:string;
	roomIds:string[];
}

interface IScheduleDisable {
	userId: string;
	when: string;
}

const EnableOutOfOfficeUserJob = 'enableOutOfOfficeUser';
const DisableOutOfOfficeUserJob = 'disableOutOfOfficeUser';

async function addToOutOfOfficeRoomsCollection(
	userId: string,
	roomIds: string[],
): Promise<void> {
	await Promise.all(
		roomIds.map(async (roomId) => OutOfOfficeRooms.addUserIdAndRoomId({ userId, roomId })),
	).catch((e) => {
		console.log(
			'Error while adding user and room to OutOfOfficeRooms collection',
			e,
		);
	});
}

class OutOfOfficeScheduler {
	private isConnected: boolean;

	private scheduler: Agenda;

	constructor() {
		this.scheduler = new Agenda({
			mongo: (
				MongoInternals.defaultRemoteCollectionDriver().mongo as any
			).client.db(),
			db: { collection: 'outofoffice_scheduler' },
			defaultConcurrency: 1,
		});
		this.isConnected = false;
	}

	private async startScheduler(): Promise<void> {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
		this.registerJobs();
	}

	private async registerJobs(): Promise<void> {
		this.scheduler.define(
			EnableOutOfOfficeUserJob,
			async ({ attrs: { data } }: Agenda.Job) => {
				const { userId, roomIds } = data;
				await addToOutOfOfficeRoomsCollection(userId,roomIds);
			},
		)
		this.scheduler.define(
			DisableOutOfOfficeUserJob,
			async ({ attrs: { _id, data } }: Agenda.Job) => {
				const { userId } = data;
				await this.scheduler.cancel({ _id });
				OutOfOfficeUsers.setDisabled(userId);
			},
		);
	}

	public async startup(): Promise<void> {
		await this.startScheduler();
		await this.registerJobs();
	}

	public async scheduleEnable({when,userId,roomIds}:IScheduleEnable):Promise<void>{
		await this.startScheduler();
		const scheduledJobs = await this.scheduler.jobs({
			name: EnableOutOfOfficeUserJob,
			data: { userId },
		});
		if (scheduledJobs.length > 0) {
			await this.scheduler.cancel({ _id: scheduledJobs[0].attrs._id }); // reschedule the job for the user
		}
		await this.scheduler.schedule(when,EnableOutOfOfficeUserJob,{userId,roomIds})
	}

	public async scheduleDisable({
		when,
		userId,
	}: IScheduleDisable): Promise<void> {
		// const when = new Date(when);
		await this.startScheduler();
		const scheduledJobs = await this.scheduler.jobs({
			name: DisableOutOfOfficeUserJob,
			data: { userId },
		});
		if (scheduledJobs.length > 0) {
			await this.scheduler.cancel({ _id: scheduledJobs[0].attrs._id }); // reschedule the job for the user
		}
		await this.scheduler.schedule(when, DisableOutOfOfficeUserJob, {
			userId,
		});
	}

	public async cancelScheduledByUser(userId: string): Promise<void> {
		await this.scheduler.cancel({
			name:EnableOutOfOfficeUserJob,
			data:{userId}
		})
		await this.scheduler.cancel({
			name: DisableOutOfOfficeUserJob,
			data: { userId },
		});
	}

	// only for debugging - remove later

	public async listAllJobs(): Promise<void> {
		await this.startScheduler();
		const jobs = await this.scheduler.jobs({ name: DisableOutOfOfficeUserJob });
		console.log(
			'the jobs in agenda are -->',
			jobs.map((j) => j.attrs),
		);
	}

	public async cancel(): Promise<void> {
		await this.scheduler.cancel({});
	}
}

export const outOfOfficeScheduler = new OutOfOfficeScheduler();

Meteor.startup(() => {
	outOfOfficeScheduler.startup();
});
