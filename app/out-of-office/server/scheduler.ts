import { Meteor } from "meteor/meteor";
import Agenda from "agenda";
import { MongoInternals } from "meteor/mongo";

import { OutOfOfficeUsers } from "../../models/server";

interface IScheduleDisable {
  userId: string;
  date: string;
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

  public async registerJobs(): Promise<void> {
    this.scheduler.define(
      Disable_OutOfOfficeUser_Job,
      async ({ attrs: { _id, data } }: Agenda.Job) => {
        console.log(" ooo job dispatched --> ", _id, " -- ", data);
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
    date,
    userId,
  }: IScheduleDisable): Promise<void> {
    // const when = new Date(date);
    await this.startScheduler();
    const scheduledJobs = await this.scheduler.jobs({
      name: Disable_OutOfOfficeUser_Job,
      data: { userId },
    });
    if (scheduledJobs.length > 0) {
      await this.scheduler.cancel({ _id: scheduledJobs[0].attrs._id }); // reschedule the job for the user
    }
    await this.scheduler.schedule(date, Disable_OutOfOfficeUser_Job, {
      userId,
    });
  }

  // remove later

  public async listAllJobs(): Promise<void> {
    await this.startScheduler();
    const jobs = await this.scheduler.jobs({ name: "disableOutOfOfficeUser" });
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
