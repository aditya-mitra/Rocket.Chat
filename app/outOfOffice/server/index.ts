import { Meteor } from "meteor/meteor";

import { Users, Rooms, Subscriptions, OutOfOffice } from "../../models/server";
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
    const defaultBot: IUser = Users.findOneById("rocket.cat");
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

    const alreadyPresentRoomIds: string[] = [];

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);

      const sub = Subscriptions.findByRoomIdAndUserIds(
        // this will produce an array with 1 element containing the roomId
        roomId,
        [deputyUser._id],
        { fields: { rid: 1 } }
      ).fetch();
      console.log("the sub was", sub);

      if (Array.isArray(sub) && sub.length > 0 && sub[0].rid === room._id) {
        // the user was already present in the room. do not remove him
        alreadyPresentRoomIds.push(room._id);
      }

      if (!room) {
        continue;
      }

      const outOfficeEnabledMessage = {
        msg: `User @${currentUser.username} is **out of office**. @${deputyUser.username} will be added as the assigning deputy for this user to this channel.`,
        rid: room._id,
      };

      executeSendMessage(defaultBot._id, outOfficeEnabledMessage);
      addUserToRoom(room._id, deputyUser, currentUser, false);
    }

    console.log(
      "the already present rooms were -- enabled --",
      alreadyPresentRoomIds
    );

    OutOfOffice.createUserOutOfOffice({
      userId: this.userId,
      deputyId: deputyUser._id,
      roomIds,
      customMessage,
      alreadyPresentRoomIds,
    });
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
      alreadyPresentRoomIds,
    } = OutOfOffice.getDocumentFromUserId(this.userId);

    const currentUser: IUser = Users.findOneById(this.userId);
    const defaultBot: IUser = Users.findOneById("rocket.cat");
    const deputyUser: IUser = Users.findOneById(deputyId);

    console.log("the already present rooms were", alreadyPresentRoomIds);

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);

      if (!room) {
        continue;
      }

      const myMessage = {
        msg: `User @${currentUser.username} is **back in office**.`,
        rid: room._id,
      };

      // send message to show that the deputy left the channel because outOfOffice was disabled
      executeSendMessage(defaultBot._id, myMessage);

      // remove the deputy from that room
      if (!alreadyPresentRoomIds.includes(room._id)) {
        removeUserFromRoom(room._id, deputyUser, { byUser: currentUser });
      }
    }

    OutOfOffice.removeUserOutOfOffice(this.userId);
  },
});

function sendReply(message: IMessage, room: IRoom) {
  // get the mention from the message

  const {
    mentionIds,
  }: { mentionIds: string[]; toHere: boolean; toAll: boolean } = getMentions(
    message as any
  );

  if (!mentionIds || mentionIds.length === 0) {
    return;
  }

  for (const mentionId of mentionIds) {
    const foundDoc = OutOfOffice.getDeputyAndCustomMessage(mentionId);

    if (!foundDoc) {
      continue;
    }

    const { customMessage } = foundDoc;

    const myMessage = {
      // send the custom message only if it is thread
      // else send the proper information message with the deputy name
      msg: customMessage,
      rid: room._id,
      tmid: (message as any).tmid,
    };
    // also notify the deputy (do not use mention in the message itself to avoid case when deputy has left the room before disabling)
    executeSendMessage("rocket.cat", myMessage);
  }

  // aditya-todo: handle the corner case when multiple users are out of office and mentioned in the same message

  return message;
}

callbacks.add(
  "afterSaveMessage",
  sendReply,
  callbacks.priority.LOW,
  "listen-for-oof"
);

interface IEnableOptionProps {
  roomIds: string[];
  deputyUsername: string;
  customMessage: string;
}
