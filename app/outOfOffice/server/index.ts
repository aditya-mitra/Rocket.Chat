import { Meteor } from "meteor/meteor";

import { Users, Rooms, OutOfOffice } from "../../models/server";
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
  enableUserOutOfOffice(roomIds: string[], deputyUsername: string) {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "enableUserOutOfOffice",
      });
    }

    const myUser: IUser = Users.findOneById(this.userId);
    const defaultBot: IUser = Users.findOneById("rocket.cat");
    const myDeputy: IUser = Users.findOneByUsername(deputyUsername);

    if (myUser._id === myDeputy._id) {
      throw new Meteor.Error(
        "error-invalid-deputy",
        "Deputy cannot be the same user",
        {
          method: "enableUserOutOfOffice",
        }
      );
    }

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);
      if (!room) {
        continue;
      }

      const myMessage = {
        msg: `User @${myUser.username} is **out of office**. @${myDeputy.username} will be added as the assigning deputy for this user to this channel.`,
        rid: room._id,
      };

      executeSendMessage(defaultBot._id, myMessage);
      addUserToRoom(room._id, myDeputy, myUser, false);
    }

    OutOfOffice.createUserOutOfOffice(this.userId, myDeputy._id, roomIds);
  },
  disableUserOutOfOffice() {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "disableUserOutOfOffice",
      });
    }

    const { roomIds, deputyId } = OutOfOffice.getOutOfOfficeRoomsAndDeputy(
      this.userId
    );

    const myUser: IUser = Users.findOneById(this.userId);
    const defaultBot: IUser = Users.findOneById("rocket.cat");
    const myDeputy: IUser = Users.findOneById(deputyId);

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);

      if (!room) {
        continue;
      }

      const myMessage = {
        msg: `User @${myUser.username} is **back in office**.`,
        rid: room._id,
      };

      // send message to show that the deputy left the channel because outOfOffice was disabled
      executeSendMessage(defaultBot._id, myMessage);

      // remove the deputy from that room
      removeUserFromRoom(room._id, myDeputy, { byUser: myUser });
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

  if (Array.isArray(mentionIds) && mentionIds.length === 0) {
    return;
  }

  // get the users who are out of office

  const docs = OutOfOffice.getUsersAndDeputysFromUserIds(mentionIds);

  if (docs.length === 0) {
    return;
  }

  // aditya-todo: handle the corner case when multiple users are out of office and mentioned in the same message

  const myMessage = {
    // send the custom message only if it is thread
    // else send the proper information message with the deputy name
    msg: "To be replaced with custom message of the user",
    rid: room._id,
    tmid: (message as any).tmid,
  };
  executeSendMessage("rocket.cat", myMessage);

  return message;
}

callbacks.add(
  "afterSaveMessage",
  sendReply,
  callbacks.priority.LOW,
  "listen-for-oof"
);
