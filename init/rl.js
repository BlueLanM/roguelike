/* eslint-disable */
const FONT = 32;

// 地图尺寸
const ROWS = 10;
const COLS = 15;

// 每关人物数量，包括玩家
const ACTORS = 10;

let map;

let asciidisplay;

// 所有人物列表，0代表玩家
let player; 
let actorList; // 人物列表
let livingEnemies; // 活着的敌人

let actorMap;

const game = new Phaser.Game(COLS * FONT * 0.6, ROWS * FONT, Phaser.AUTO, null, {
	create
});

function create() {
	game.input.keyboard.addCallbacks(null, null, onKeyUp);

	initMap();

	asciidisplay = [];
	for (let y = 0; y < ROWS; y++) {
		const newRow = [];
		asciidisplay.push(newRow);
		for (let x = 0; x < COLS; x++) { newRow.push(initCell("", x, y)); }
	}

	initActors();

	drawMap();
	drawActors();
}

function initCell(chr, x, y) {
	const style = {
		fill: "#fff",
		font: FONT + "px monospace"
	};
	return game.add.text(FONT * 0.6 * x, FONT * y, chr, style);
}

function initMap() {
	map = [];
	for (let y = 0; y < ROWS; y++) {
		const newRow = [];
		for (let x = 0; x < COLS; x++) {
			if (Math.random() > 0.8) { newRow.push("#"); } else { newRow.push("."); }
		}
		map.push(newRow);
	}
}

// 绘制地图
function drawMap() {
	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) { asciidisplay[y][x].content = map[y][x]; }
	}
}

function randomInt(max) {
	return Math.floor(Math.random() * max);
}

function initActors() {
	actorList = [];
	actorMap = {};
	for (let e = 0; e < ACTORS; e++) {
		// create new actor
		const actor = {
			hp: e == 0 ? 3 : 1,
			x: 0,
			y: 0
		};
		do {
			actor.y = randomInt(ROWS);
			actor.x = randomInt(COLS);
		} while (map[actor.y][actor.x] == "#" || actorMap[actor.y + "_" + actor.x] != null);

		actorMap[actor.y + "_" + actor.x] = actor;
		actorList.push(actor);
	}

	player = actorList[0];
	livingEnemies = ACTORS - 1;
}

function drawActors() {
	for (const a in actorList) {
		if (actorList[a] != null && actorList[a].hp > 0) { asciidisplay[actorList[a].y][actorList[a].x].content = a == 0 ? "" + player.hp : "e"; }
	}
}

function canGo(actor, dir) {
	return 	actor.x + dir.x >= 0
			&& actor.x + dir.x <= COLS - 1
			&& actor.y + dir.y >= 0
			&& actor.y + dir.y <= ROWS - 1
			&& map[actor.y + dir.y][actor.x + dir.x] == ".";
}

function moveTo(actor, dir) {

	if (!canGo(actor, dir)) { return false; }

	const newKey = (actor.y + dir.y) + "_" + (actor.x + dir.x);
	if (actorMap[newKey] != null) {
		const victim = actorMap[newKey];
		victim.hp--;

		if (victim.hp == 0) {
			actorMap[newKey] = null;
			actorList[actorList.indexOf(victim)] = null;
			if (victim != player) {
				livingEnemies--;
				if (livingEnemies == 0) {
					const victory = game.add.text(game.world.centerX, game.world.centerY, "Victory!\nCtrl+r to restart", { align: "center", fill: "#2e2" });
					victory.anchor.setTo(0.5, 0.5);
				}
			}
		}
	} else {
		actorMap[actor.y + "_" + actor.x] = null;

		actor.y += dir.y;
		actor.x += dir.x;

		actorMap[actor.y + "_" + actor.x] = actor;
	}
	return true;
}

function onKeyUp(event) {
	drawMap();

	let acted = false;
	switch (event.keyCode) {
		case Phaser.Keyboard.LEFT:
			acted = moveTo(player, { x: -1, y: 0 });
			break;

		case Phaser.Keyboard.RIGHT:
			acted = moveTo(player, { x: 1, y: 0 });
			break;

		case Phaser.Keyboard.UP:
			acted = moveTo(player, { x: 0, y: -1 });
			break;

		case Phaser.Keyboard.DOWN:
			acted = moveTo(player, { x: 0, y: 1 });
			break;
	}

	if (acted) {
		for (const enemy in actorList) {
			if (enemy == 0) { continue; }

			const e = actorList[enemy];
			if (e != null) { aiAct(e); }
		}
	}

	drawActors();
}

function aiAct(actor) {
	const directions = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
	const dx = player.x - actor.x;
	const dy = player.y - actor.y;

	if (Math.abs(dx) + Math.abs(dy) > 6)
	{ while (!moveTo(actor, directions[randomInt(directions.length)])) { } }

	if (Math.abs(dx) > Math.abs(dy)) {
		if (dx < 0) {
			// 左
			moveTo(actor, directions[0]);
		} else {
			// 右
			moveTo(actor, directions[1]);
		}
	} else {
		if (dy < 0) {
			// 上
			moveTo(actor, directions[2]);
		} else {
			// 下
			moveTo(actor, directions[3]);
		}
	}
	if (player.hp < 1) {
		// 游戏结束
		const gameOver = game.add.text(game.world.centerX, game.world.centerY, "Game Over\nCtrl+r to restart", { align: "center", fill: "#e22" });
		gameOver.anchor.setTo(0.5, 0.5);
	}
}