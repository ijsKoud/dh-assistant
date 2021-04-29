import EventEmitter from "events";
import dhClient from "../../client/client";

export default class notifcations extends EventEmitter {
	constructor(public client: dhClient) {
		super();
	}
}
