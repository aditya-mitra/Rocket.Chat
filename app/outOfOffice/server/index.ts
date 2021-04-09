import { Meteor } from "meteor/meteor";

import { Users, Rooms, Subscriptions, OutOfOffice } from "../../models/server";
import type { IOutOfOfficeModel } from "../../models/server/models/UsersOutOfOffice";
import { executeSendMessage } from "../../lib/server/methods/sendMessage";
import { addUserToRoom } from "../../lib/server/functions/addUserToRoom";
import { removeUserFromRoom } from "../../lib/server/functions/removeUserFromRoom";
import { getMentions } from "../../lib/server/lib/notifyUsersOnMessage";
import { callbacks } from "../../callbacks/server";

import { IUser } from "../../../definition/IUser";
import { IRoom } from "../../../definition/IRoom";
import { IMessage } from "../../../definition/IMessage";

// const kameUserId = "JMXwCKiQ9v28Hf7Ef";
// const camelRidersRoomId = "mPcbxJxRzzjwdCF7f";
// const deputyUserId = "8hWHiTdK7yTEsXCxo";
// const gothamCityRoomId = "nbdMeQ4TiQXYNFaGk";

Meteor.methods({
  enableUserOutOfOffice({
    roomIds,
    deputyUsername,
    customMessage,
  }: IEnableOptionProps) {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "enableUserOutOfOffice",
      });
    }

    const currentUser: IUser = Users.findOneById(this.userId);
    const deputyUser: IUser = Users.findOneByUsername(deputyUsername);

    if (currentUser._id === deputyUser._id) {
      throw new Meteor.Error(
        "error-invalid-deputy",
        "Deputy cannot be the same user",
        {
          method: "enableUserOutOfOffice",
        }
      );
    }

    const deputyPresentRoomIds: string[] = [];

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);

      const sub = Subscriptions.findByRoomIdAndUserIds(
        // this will produce an array with 1 element containing the roomId
        roomId,
        [deputyUser._id],
        { fields: { rid: 1 } }
      ).fetch();

      if (Array.isArray(sub) && sub.length > 0 && sub[0].rid === room._id) {
        // the user was already present in the room. do not remove him
        deputyPresentRoomIds.push(room._id);
      }

      if (!room) {
        continue;
      }

      // executeSendMessage(defaultBot._id, outOfficeEnabledMessage);
      addUserToRoom(room._id, deputyUser, currentUser, false);
    }

    const a = OutOfOffice.createUserOutOfOffice({
      userId: this.userId,
      deputyId: deputyUser._id,
      roomIds,
      customMessage,
      deputyPresentRoomIds,
      mentionedUserIds: [],
      sentRoomIds: [],
    });

    console.log("the document created was", a);

    /*const when = new Date();
    when.setMinutes(when.getMinutes() + 1);

    (Promise as any).await(scheduler.runAfterT(when, a));*/
  },
  disableUserOutOfOffice() {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "disableUserOutOfOffice",
      });
    }

    const {
      roomIds,
      deputyId,
      deputyPresentRoomIds,
    } = OutOfOffice.getDocumentFromUserId(this.userId);

    const currentUser: IUser = Users.findOneById(this.userId);
    const deputyUser: IUser = Users.findOneById(deputyId);

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);

      if (!room) {
        continue;
      }
      // remove the deputy from that room
      if (!deputyPresentRoomIds.includes(room._id)) {
        removeUserFromRoom(room._id, deputyUser, { byUser: currentUser });
      }
    }

    OutOfOffice.removeUserOutOfOffice(this.userId);
  },
});

callbacks.add(
  "afterSaveMessage",
  sendReplyForOutOfOffice,
  callbacks.priority.LOW,
  "listen-for-oof"
);

interface IEnableOptionProps {
  roomIds: string[];
  deputyUsername: string;
  customMessage: string;
}

function sendReplyForOutOfOffice(message: IMessage, room: IRoom) {
  const {
    mentionIds,
  }: { mentionIds: string[]; toHere: boolean; toAll: boolean } = getMentions(
    message as any
  );

  // notify the mentioning user if any
  if (mentionIds && mentionIds.length > 0) {
    sendMessageToMentioners(mentionIds, message, room);
    return message;
  }

  const docs = OutOfOffice.getDocsFromRoomId(room._id);

  for (const doc of docs) {
    if (!doc.sentRoomIds.includes(room._id)) {
      OutOfOffice.updateSentRoomIds(doc._id, room._id);
      sendUserCustomMessageToChannel(doc, message, room);
    }
  }

  return message;
}

function sendMessageToMentioners(
  mentionIds: string[],
  message: IMessage,
  room: IRoom
) {
  // check for all mentions
  for (const mentionId of mentionIds) {
    const foundDoc = OutOfOffice.getDocumentFromUserId(mentionId);

    console.log("the doc was", foundDoc);
    if (!foundDoc || foundDoc.mentionedUserIds.includes(message.u._id)) {
      continue; // do not sent a message if the mentioner is already aware
    }

    sendUserCustomMessageToChannel(foundDoc, message, room);

    /*
    ONLY YOU CAN SEE THIS MESSAGE not working
    (the sender is always rocket.cat)

    const myMessage = {
      msg: foundDoc.customMessage,
      rid: room._id,
      tmid: (message as any).tmid,
      alias: "Out of Office",
    };

    api.broadcast(
      "notify.ephemeralMessage",
      message.u._id,
      room._id,
      myMessage
    );
    */

    // store the user who mentioned
    OutOfOffice.updateMentionedUserIds(foundDoc._id, message.u._id);
  }
}

function sendUserCustomMessageToChannel(
  doc: IOutOfOfficeModel,
  _message: IMessage,
  room: IRoom
) {
  // send the message to room if not already present
  const myMessage = {
    msg: doc.customMessage,
    rid: room._id,
    alias: "Out of Office",
  };
  executeSendMessage(doc.userId, myMessage);
}

// clear the out of office database on server restart
Meteor.startup(() => {
  OutOfOffice.removeAllDocuments();
  console.log(
    "the out of office collection contains = ",
    OutOfOffice.find()?.count?.()
  );
});

// https://github.com/wreiske/Rocket.Chat.App-Tenor
