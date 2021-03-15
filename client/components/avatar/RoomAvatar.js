import React, { memo } from 'react';

import BaseAvatar from './BaseAvatar';
import { useRoomAvatarPath } from '../../contexts/AvatarUrlContext';

function RoomAvatar({ room, ...rest }) {

	console.log('the room data is',room);
	
	
	const getRoomPathAvatar = useRoomAvatarPath();
	const { url = getRoomPathAvatar(room), ...props } = rest;
	return <BaseAvatar url={url} {...props}/>;
}

export default memo(RoomAvatar);
