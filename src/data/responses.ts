export const error = (cmd: string, err: string) =>
	`>>> ❗ | **${cmd} command - Error**:\`\`\`xl\n${err}\`\`\`ℹ | This error is most likely on our side- please **screenshot** this error message, as well as your input, and send it to **DaanGamesDG#7621**.`;
export const missingArg = (e: string) => `>>> 💡 | **Syntax Error**:\n${e}`;

export const dm = (type: string, msg: string) => `>>> 💡 | **${type} Received**:\n${msg}`;
export const ban = (guild: string, reason: string, duration?: string) =>
	`>>> 🔨 | **${duration ? "Tempban" : "Ban"} Received**:\nYou have been banned from **${guild}**.${
		duration ? `\nDuration: \`${duration}\`` : ""
	}\nReason: **${reason}**\n\n**Appeal Form**: https://forms.gle/RMT5X7gcYh6iuPqM6`;
export const kick = (guild: string, reason: string) =>
	`>>> 👞 | **Kick Received**:\nYou have been kicked from **${guild}**.\nReason: **${reason}**`;
export const mute = (guild: string, reason: string, duration: string) =>
	`>>> 🔇 | **Mute Received**:\nYou have been muted in **${guild}**.
		\nDuration: \`${duration}\`\nReason: ${reason}`;
export const warn = (guild: string, reason: string) =>
	`>>> 📂 | **Warning Received**:\nYou have been warned in **${guild}**.\nReason: **${reason}**`;

// public colours = {
//   red: "#DA5C59",
//   green: "#4AF3AB",
//   pink: "#FD6CE1",
//   orange: "#F3884A",
//   yellow: "#FFF68B",
// };
