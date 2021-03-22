import { Meteor } from "meteor/meteor";

import { Users, Rooms, OutOfOffice } from "../../models/server";
import { executeSendMessage } from "../../lib/server/methods/sendMessage";
import { addUserToRoom } from "../../lib/server/functions/addUserToRoom";
import { removeUserFromRoom } from "../../lib/server/functions/removeUserFromRoom";

import { IUser } from "../../../definition/IUser";
import { IRoom } from "../../../definition/IRoom";

// const kameUserId = "JMXwCKiQ9v28Hf7Ef";
// const camelRidersRoomId = "mPcbxJxRzzjwdCF7f";
const deputyUserId = "8hWHiTdK7yTEsXCxo";

Meteor.methods({
  enableUserOutOfOffice(roomIds: string[]) {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "saveUserProfile",
      });
    }

    const myUser: IUser = Users.findOneById("rocket.cat");
    const myDeputy: IUser = Users.findOneById(deputyUserId);

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);
      if (!room) {
        continue;
      }

      const myMessage = {
        msg:
          "I am now **out of office**. I have selected @mydeputy as my deputy.",
        rid: room._id,
      };

      executeSendMessage(myUser._id, myMessage);
      addUserToRoom(room._id, myDeputy, myUser, false);
    }

    OutOfOffice.createUserOutOfOffice(this.userId, myDeputy._id, roomIds);
  },
  disableUserOutOfOffice() {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "saveUserProfile",
      });
    }

    const roomIds = OutOfOffice.getOutOfOfficeRooms(this.userId);

    const myUser: IUser = Users.findOneById("rocket.cat");
    const myDeputy: IUser = Users.findOneById(deputyUserId);

    for (const roomId of roomIds) {
      const room: IRoom = Rooms.findOneById(roomId);

      if (!room) {
        continue;
      }

      const myMessage = {
        msg: "I am now **back in office**. Thanks @mydeputy for helping",
        rid: room._id,
      };

      // send message to show that the deputy left the channel because outOfOffice was disabled
      executeSendMessage(myUser._id, myMessage);

      // remove the deputy from that room
      removeUserFromRoom(room._id, myDeputy, { byUser: myUser });
    }

    OutOfOffice.removeUserOutOfOffice(this.userId);
  },
});
