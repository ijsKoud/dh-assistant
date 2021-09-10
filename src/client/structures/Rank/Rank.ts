import {
	createCanvas,
	registerFont,
	Canvas,
	CanvasRenderingContext2D,
	loadImage,
	Image,
} from "canvas";
import { join } from "path";
import { fillTextWithTwemoji, measureText } from "node-canvas-with-twemoji-and-discord-emoji";

export class Rank {
	protected canvas: Canvas;
	protected ctx: CanvasRenderingContext2D;

	constructor(public data: RankOptions) {
		this.registerFonts();

		this.canvas = createCanvas(800, 230);
		this.ctx = this.canvas.getContext("2d");
	}

	public async build(): Promise<Buffer> {
		await this.loadBase(this.data.base);
		await this.drawName();

		// add discrim (#0000)
		this.ctx.fillStyle = "#212121";
		const { width } = measureText(this.ctx, this.data.username);
		this.ctx.fillText(`#${this.data.discrim}`, 247 + 5 + width, 120);

		// back of progressbar
		this.ctx.fillStyle = "#181A1B";
		this.ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
		this.ctx.shadowBlur = 4;
		this.ctx.shadowOffsetY = 4;
		this.drawRect(480, 40, 10, 247, 132);

		this.resetShadow();

		// add front of progressbar
		this.ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
		this.ctx.shadowColor = "rgba(0, 0, 0, 0.40)";
		this.ctx.shadowBlur = 3;
		this.ctx.shadowOffsetX = 4;
		this.drawRect((this.data.xp / this.data.required) * 480, 40, 10, 247, 132);

		this.resetShadow();

		// add xp stats
		this.ctx.fillStyle = "#fff";
		this.ctx.font = "regular 25px Poppins";
		this.ctx.fillText(`${this.data.xp} / ${this.data.required}`, 424, 161);

		// add level and rank stats
		this.ctx.font = "bold 25px Poppins";
		this.ctx.fillText(
			`LEVEL ${this.data.level} / RANK ${this.data.rank}`,
			this.canvas.width -
				35 -
				this.ctx.measureText(`LEVEL ${this.data.level} / RANK ${this.data.rank}`).width,
			41
		);

		// add user avatar
		const avatar = await loadImage(this.data.avatar);

		this.ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
		this.ctx.shadowBlur = 4;
		this.ctx.shadowOffsetY = 4;
		this.drawImage(130, 130, 10, 38, 50, avatar);

		return this.canvas.toBuffer();
	}

	protected registerFonts() {
		const base = join(__dirname, "assets", "fonts");
		registerFont(join(base, "regular.ttf"), { family: "Poppins", weight: "regular" });
		registerFont(join(base, "semiBold.ttf"), { family: "Poppins", weight: "bold" });
	}

	protected async loadBase(id = "base") {
		const img = await loadImage(join(__dirname, "assets", "images", `${id}.png`));
		this.ctx.drawImage(img, 0, 0);
	}

	protected drawRect(width: number, height: number, radius: number, x: number, y: number) {
		if (width < 2 * radius) radius = width / 2;
		if (height < 2 * radius) radius = height / 2;
		this.ctx.beginPath();
		this.ctx.moveTo(x + radius, y);
		this.ctx.arcTo(x + width, y, x + width, y + height, radius);
		this.ctx.arcTo(x + width, y + height, x, y + height, radius);
		this.ctx.arcTo(x, y + height, x, y, radius);
		this.ctx.arcTo(x, y, x + width, y, radius);
		this.ctx.closePath();
		this.ctx.fill();
	}

	protected drawImage(
		width: number,
		height: number,
		radius: number,
		x: number,
		y: number,
		img: Image
	) {
		this.ctx.save();

		this.ctx.beginPath();
		this.ctx.moveTo(x + radius, y);
		this.ctx.arcTo(x + width, y, x + width, y + height, radius);
		this.ctx.arcTo(x + width, y + height, x, y + height, radius);
		this.ctx.arcTo(x, y + height, x, y, radius);
		this.ctx.arcTo(x, y, x + width, y, radius);
		this.ctx.closePath();

		this.ctx.clip();
		this.ctx.drawImage(img, x, y, width, height);
		this.ctx.restore();
	}

	protected resetShadow() {
		this.ctx.shadowColor = "rgba(0, 0, 0, 0)";
		this.ctx.shadowBlur = 0;
		this.ctx.shadowOffsetY = 0;
		this.ctx.shadowOffsetX = 0;
	}

	protected async drawName() {
		const max = 19;
		this.ctx.font = "regular 30px Poppins";
		this.ctx.fillStyle = "#fff";

		if (this.data.username.length > max) {
			this.ctx.font = "regular 25px Poppins";
			this.data.username = this.data.username.slice(0, 19) + "...";
		}

		await fillTextWithTwemoji(this.ctx, this.data.username, 247, 120);
	}
}

interface RankOptions {
	username: string;
	discrim: string;
	avatar: string;
	level: number;
	rank: number;
	xp: number;
	required: number;
	base?: string;
}
