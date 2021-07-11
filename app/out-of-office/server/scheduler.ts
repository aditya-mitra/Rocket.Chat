import { Meteor } from "meteor/meteor";
import Agenda from "agenda";
import { MongoInternals } from "meteor/mongo";

import { OutOfOfficeUsers } from "../../models/server";

interface IScheduleDisable {
  userId: string;
  when: string;
}

const Disable_OutOfOfficeUser_Job = "disableOutOfOfficeUser";

class OutOfOfficeScheduler {
  private isConnected: boolean;
  private scheduler: Agenda;

  constructor() {
    this.scheduler = new Agenda({
      mongo: (
        MongoInternals.defaultRemoteCollectionDriver().mongo as any
      ).client.db(),
      db: { collection: "outofoffice_scheduler" },
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
      Disable_OutOfOfficeUser_Job,
      async ({ attrs: { _id, data } }: Agenda.Job) => {
        const { userId } = data;
        await this.scheduler.cancel({ _id });
        OutOfOfficeUsers.setDisabled(userId);
      }
    );
  }

  public async startup(): Promise<void> {
    await this.startScheduler();
    await this.registerJobs();
  }

  public async scheduleDisable({
    when,
    userId,
  }: IScheduleDisable): Promise<void> {
    // const when = new Date(when);
    await this.startScheduler();
    const scheduledJobs = await this.scheduler.jobs({
      name: Disable_OutOfOfficeUser_Job,
      data: { userId },
    });
    if (scheduledJobs.length > 0) {
      await this.scheduler.cancel({ _id: scheduledJobs[0].attrs._id }); // reschedule the job for the user
    }
    await this.scheduler.schedule(when, Disable_OutOfOfficeUser_Job, {
      userId,
    });
  }

  public async cancelScheduledDisableByUser(userId: string) {
    await this.scheduler.cancel({
      name: Disable_OutOfOfficeUser_Job,
      data: { userId },
    });
  }

  // only for debugging - remove later

  public async listAllJobs(): Promise<void> {
    await this.startScheduler();
    const jobs = await this.scheduler.jobs({ name: Disable_OutOfOfficeUser_Job });
    console.log(
      "the jobs in agenda are -->",
      jobs.map((j) => j.attrs)
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
