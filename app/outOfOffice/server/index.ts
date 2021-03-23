import { Meteor } from "meteor/meteor";

import { Users, Rooms, OutOfOffice } from "../../models/server";
import { executeSendMessage } from "../../lib/server/methods/sendMessage";
import { addUserToRoom } from "../../lib/server/functions/addUserToRoom";
import { removeUserFromRoom } from "../../lib/server/functions/removeUserFromRoom";

import { IUser } from "../../../definition/IUser";
import { IRoom } from "../../../definition/IRoom";

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
