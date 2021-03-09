import { config } from "dotenv";
import launchClient from "./client/client";
config();

new launchClient({ ownerID: ["304986851310043136"] }).start();
