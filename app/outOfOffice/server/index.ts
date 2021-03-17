import { Meteor } from "meteor/meteor";

import { Users, Rooms } from "../../models/server";
import { executeSendMessage } from "../../lib/server/methods/sendMessage";

import { IUser } from "../../../definition/IUser";
import { IRoom } from "../../../definition/IRoom";

const kameUserId = "JMXwCKiQ9v28Hf7Ef";
const camelRidersRoomId = "mPcbxJxRzzjwdCF7f";

Meteor.methods({
  enableUserOutOfOffice() {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "saveUserProfile",
      });
    }

    const myUser: IUser = Users.findOneById(kameUserId);
    const myRoom: IRoom = Rooms.findOneById(camelRidersRoomId);

    const myMessage = {
      msg: "This user is **out of office**",
      rid: myRoom._id,
    };

    executeSendMessage(myUser._id, myMessage);

    // TODO: add deputy to room
  },
  disableUserOutOfOffice() {
    if (!this.userId) {
      throw new Meteor.Error("error-invalid-user", "Invalid user", {
        method: "saveUserProfile",
      });
    }

    // TODO: remove the deputy from room
  },
});
