import { Meteor } from "meteor/meteor";

import { Users, Rooms } from "../../models/server";
import { executeSendMessage } from "../../lib/server/methods/sendMessage";
import { addUserToRoom } from "../../lib/server/functions/addUserToRoom";
import { removeUserFromRoom } from "../../lib/server/functions/removeUserFromRoom";

import { IUser } from "../../../definition/IUser";
import { IRoom } from "../../../definition/IRoom";

const kameUserId = "JMXwCKiQ9v28Hf7Ef";
const camelRidersRoomId = "mPcbxJxRzzjwdCF7f";
const deputyUserId = "8hWHiTdK7yTEsXCxo";

Meteor.methods({
  enableUserOutOfOffice() {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "saveUserProfile",
      });
    }

    const myUser: IUser = Users.findOneById(kameUserId);
    const myRoom: IRoom = Rooms.findOneById(camelRidersRoomId);
    const myDeputy: IUser = Users.findOneById(deputyUserId);

    const myMessage = {
      msg:
        "I am now **out of office**. I have selected @mydeputy as my deputy.",
      rid: myRoom._id,
    };

    // send a message to channel
    executeSendMessage(myUser._id, myMessage);

    // add a deputy to the room
    addUserToRoom(myRoom._id, myDeputy, myUser, false);
  },
  disableUserOutOfOffice() {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "saveUserProfile",
      });
    }

    const myUser: IUser = Users.findOneById(kameUserId);
    const myRoom: IRoom = Rooms.findOneById(camelRidersRoomId);
    const myDeputy: IUser = Users.findOneById(deputyUserId);

    const myMessage = {
      msg: "I am now **back in office**. Thanks @mydeputy for helping",
      rid: myRoom._id,
    };

    // send message to show that the deputy left the channel because outOfOffice was disabled
    executeSendMessage(myUser._id, myMessage);

    // remove the deputy from that room
    removeUserFromRoom(myRoom._id, myDeputy, { byUser: myUser });
  },
});
