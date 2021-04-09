import { Meteor } from "meteor/meteor";
import Agenda from "agenda";
import { MongoInternals } from "meteor/mongo";

export default class OutOfOfficeScheduler {
  scheduler: Agenda;
  public async init(): Promise<void> {
    this.scheduler = new Agenda({
      mongo: (MongoInternals.defaultRemoteCollectionDriver()
        .mongo as any).client.db(),
      db: { collection: "Out_Of_Office_Scheduler" },
      defaultConcurrency: 1,
    });
    await this.scheduler.start();
  }

  /**
   * @param t time at which OOO will be enabled
   * @param docId object id of the Out of Offic document
   */
  async runAfterT(t: Date, docId: string) {
    await this.scheduler.define(docId, () => {
        console.log('working');
    });
    await this.scheduler.schedule(t, docId);
  }
}

export const scheduler = new OutOfOfficeScheduler();

Meteor.startup(() => {
  scheduler.init();
});
