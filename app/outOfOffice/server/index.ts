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
  enableUserOutOfOffice({ roomIds, deputyUsername }: IEnableOptionProps) {
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

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);
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

    OutOfOffice.createUserOutOfOffice(this.userId, deputyUser._id, roomIds);
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

    const currentUser: IUser = Users.findOneById(this.userId);
    const defaultBot: IUser = Users.findOneById("rocket.cat");
    const deputyUser: IUser = Users.findOneById(deputyId);

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
      removeUserFromRoom(room._id, deputyUser, { byUser: currentUser });
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

  // get the users who are out of office

  const docs = OutOfOffice.getUsersAndDeputysFromUserIds(mentionIds);
  console.log("checking this one", docs, "\nand\n", mentionIds);

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

interface IEnableOptionProps {
  roomIds: string[];
  deputyUsername: string;
  customMessage: string;
}
