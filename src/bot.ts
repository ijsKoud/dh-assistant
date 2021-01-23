import { config } from "dotenv";
import osloClient from "./client/client";
config();

const client = new osloClient({ ownerID: ["304986851310043136"] });
client.start();
