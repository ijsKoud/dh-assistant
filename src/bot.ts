import { config } from "dotenv";
import dhClient from "./client/client";
config();

new dhClient({
	ownerID: ["304986851310043136"],
}).start();
