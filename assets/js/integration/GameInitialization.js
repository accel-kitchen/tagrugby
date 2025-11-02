/* --------------------------------------------------------------------------
 * Game Initialization
 * ゲームの初期化とメイン関数を管理
 * -------------------------------------------------------------------------- */

import { GameConfig } from '../config/GameConfig.js';
import { GameController } from '../game/GameController.js';
import { CanvasRenderer } from '../rendering/CanvasRenderer.js';
import { refreshParam } from '../rendering/UIRefresher.js';
import { resizeCanvas } from '../rendering/CanvasResizer.js';
import { appState } from '../state/AppState.js';
import { getMovableList, getPassList } from '../game/ActionValidator.js';
import { rugby_AI } from '../ai/AIRegistry.js';
import { arrayTurn } from '../utils/gameUtils.js';
import { copyArray } from '../utils/array.js';

// グローバル変数（既存コードとの互換性のため）
let canvas;
let ctx;
let game;
let tag = "";
let gameEndFlag = 0;
let AIthinkFlag = 0;
let restartFlag = 0;
let mouseX = 0;
let mouseY = 0;
let mouseBlockX = 0;
let mouseBlockY = 0;
let Role = ["human", "human", "sample1"];
let anaRole = ["DefenseSample1", "AttackAI"];
let attack_wins = 0;
let defense_wins = 0;
let renderer;

/**
 * キャンバスサイズを調整
 */
function canvas_resize() {
	const result = resizeCanvas(canvas, ctx, () => {
		if (renderer && game) {
			renderer.draw(() => refreshParam(game));
		}
	});
	if (result && renderer) {
		renderer.updateSize(result.BLOCKSIZE, window.BOARDSIZE, window.NUMSIZE, result.CANVASSIZE);
		window.BLOCKSIZE = result.BLOCKSIZE;
		window.CANVASSIZE = result.CANVASSIZE;
		window.ANALYSISSIZE = result.ANALYSISSIZE;
	}
}

/**
 * マウスの移動
 */
function moveMouse(event) {
	mouseX = event.offsetX;
	mouseY = event.offsetY;
	mouseX = ~~((mouseX / canvas.offsetWidth) * (window.CANVASSIZE + window.NUMSIZE));
	mouseY = ~~((mouseY / canvas.offsetHeight) * (window.CANVASSIZE + window.NUMSIZE));
	mouseBlockX = ~~((mouseX - window.NUMSIZE - 0.5) / window.BLOCKSIZE);
	mouseBlockY = ~~((mouseY - window.NUMSIZE - 0.5) / window.BLOCKSIZE);
}

/**
 * ゲーム終了時の処理
 */
function gameOver(result_Diff, x, y) {
	gameEndFlag = 1;
	if (renderer) {
		renderer.drawFinalDisc(x, y);
	}
	if (result_Diff == 1) {
		attack_wins += 1;
		document.getElementById("attack_win_num").innerHTML = "攻め手 " + attack_wins + "回";
	} else if (result_Diff == -1) {
		defense_wins += 1;
		document.getElementById("defense_win_num").innerHTML = "守り手 " + defense_wins + "回";
	}
	const total = attack_wins + defense_wins;
	if (total > 0) {
		document
			.getElementById("attack_win_num")
			.setAttribute("style", "width: " + (attack_wins / total) * 100 + "%");
		document
			.getElementById("defense_win_num")
			.setAttribute("style", "width: " + (defense_wins / total) * 100 + "%");
	}
	setTimeout(() => {
		rematch();
	}, window.ENDDURATION);
}

/**
 * 初期化
 */
function init() {
	canvas = document.getElementById("canvas");
	if (!canvas) return;

	ctx = canvas.getContext("2d");
	if (!ctx) return;

	appState.setCanvas(canvas, ctx);

	canvas.onmousemove = moveMouse;
	canvas.onclick = function () {
		if (AIthinkFlag == 0) {
			game.humanTurn(mouseBlockX, mouseBlockY, () => {
				if (renderer) {
					renderer.draw(() => refreshParam(game));
				}
			}, gameOver, appState);
		}
	};

	gameEndFlag = 0;
	game = new GameController(Role[0], Role[1]);
	renderer = new CanvasRenderer(canvas, ctx, game, appState);

	tag = "";
	for (let i = 0; i < window.MAXTAG; i++) {
		tag += GameConfig.TAG_IMG;
	}
	document.getElementById("tag").innerHTML = tag;

	window.addEventListener("resize", canvas_resize, false);
	canvas_resize();

	if (renderer) {
		renderer.draw(() => refreshParam(game));
	}

	if (Role[1] != "human") {
		AIthinkFlag = 1;
		game.AIturn(
			() => {
				if (renderer) {
					renderer.draw(() => refreshParam(game));
				}
			},
			gameOver,
			appState,
			Role
		);
	}
}

/**
 * リマッチ初期化
 */
function rematchInit() {
	document.getElementById("result").innerHTML = "";
	AIthinkFlag = 0;
	game.turn = 1;
	game.pos[0] = window.POSDEFENSE.copy();
	game.pos[1] = window.POSATTACK.copy();
	game.select = 0;
	game.ball = 0;
	game.step = 0;
	game.tag = window.MAXTAG;
	tag = "";
	for (let i = 0; i < window.MAXTAG; i++) {
		tag += GameConfig.TAG_IMG;
	}
	document.getElementById("tag").innerHTML = tag;
	if (renderer) {
		renderer.draw(() => refreshParam(game));
	}
}

/**
 * リマッチ
 */
function rematch() {
	rematchInit();
	if (Role[arrayTurn(game.turn)] != "human") {
		AIthinkFlag = 1;
		game.AIturn(
			() => {
				if (renderer) {
					renderer.draw(() => refreshParam(game));
				}
			},
			gameOver,
			appState,
			Role
		);
	}
}

/**
 * 設定
 */
function config() {
	try {
		window.BOARDSIZE = parseInt(document.ConfigForm.boardsize.value);
		const attack_num = parseInt(document.ConfigForm.attackNum.value);
		const defense_num = parseInt(document.ConfigForm.defenseNum.value);
		window.MAXTAG = parseInt(document.ConfigForm.tag_num.value);
		if (typeof pos_editor !== 'undefined') {
			eval(pos_editor.getValue());
		}
	} catch (err) {
		document.getElementById("poserror").innerHTML = "初期位置の書き方が正しくありません。" + err;
	}
	window.CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4];
	window.POSATTACK = window.POSATTACK.slice(0, attack_num);
	window.POSDEFENSE = window.POSDEFENSE.slice(0, defense_num);
	rematchInit();
}

/**
 * リスタート
 */
function restart() {
	document.getElementById("attack_win_num").innerHTML = 0;
	document.getElementById("defense_win_num").innerHTML = 0;
	tag = "";
	for (let i = 0; i < window.MAXTAG; i++) {
		tag += GameConfig.TAG_IMG;
	}
	document.getElementById("tag").innerHTML = tag;

	Role[1] = document.ControlForm.attack_role.value;
	Role[0] = document.ControlForm.defense_role.value;
	game.Role[0] = Role[0];
	game.Role[1] = Role[1];

	const game_speed = document.ControlForm.game_speed.value;
	if (game_speed == 0) {
		window.DELAYDURATION = 1500;
		window.ENDDURATION = 1000;
	} else if (game_speed == 1) {
		window.DELAYDURATION = 100;
		window.ENDDURATION = 1000;
	} else {
		window.DELAYDURATION = 0;
		window.ENDDURATION = 1000;
	}

	if (Role[arrayTurn(game.turn)] != "human" && restartFlag == 0) {
		AIthinkFlag = 1;
		game.AIturn(
			() => {
				if (renderer) {
					renderer.draw(() => refreshParam(game));
				}
			},
			gameOver,
			appState,
			Role
		);
	}

	if (Role[0] != "human" && Role[1] != "human") {
		restartFlag = 1;
	} else {
		restartFlag = 0;
	}
}

/**
 * サンプル設定
 */
function sampleset() {
	const sample_num = parseInt(document.SampleForm.samplenum.value);
	window.BOARDSIZE = window.sample[sample_num].boardsize;
	window.POSATTACK = window.sample[sample_num].attackpos;
	window.POSDEFENSE = window.sample[sample_num].defensepos;
	window.CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	rematchInit();
}

/**
 * 分析
 */
function analysis() {
	if (typeof clearError === 'function') {
		clearError();
	}
	if (!renderer || !game) return;

	ctx.clearRect(0, 0, window.CANVASSIZE + window.NUMSIZE, window.CANVASSIZE + window.NUMSIZE);
	renderer.draw(() => refreshParam(game));

	ctx.beginPath();
	ctx.font = window.ANALYSISSIZE + "px Osaka";
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ctx.globalAlpha = 1;
	ctx.fillStyle = GameConfig.Colors.FONTCOLOR;

	let action_list = [];
	const movablelist = getMovableList(
		copyArray(game.pos),
		game.turn,
		game.select,
		game.tagged,
		window.BOARDSIZE
	);
	const passlist = getPassList(
		copyArray(game.pos),
		game.turn,
		game.select,
		game.ball
	);
	action_list = action_list.concat(movablelist);
	action_list = action_list.concat(passlist);

	if (action_list.length == 0) {
		return;
	}

	const AI_name = anaRole[arrayTurn(game.turn)];
	const aiFunc = rugby_AI[AI_name];
	if (!aiFunc) return;

	const [nextmove, eval_list] = aiFunc(
		game.pos,
		game.turn,
		game.select,
		game.ball,
		game.tagged
	);

	ctx.fillStyle = GameConfig.Colors.ANAMOVEFONTCOLOR;
	for (let i = 0; i < movablelist.length; i++) {
		ctx.fillText(
			Math.floor(eval_list[i]),
			action_list[i][0] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5,
			action_list[i][1] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5
		);
	}
	ctx.fillStyle = GameConfig.Colors.ANAPASSFONTCOLOR;
	for (let i = movablelist.length; i < movablelist.length + passlist.length; i++) {
		ctx.fillText(
			Math.floor(eval_list[i]),
			action_list[i][0] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5,
			action_list[i][1] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5
		);
	}
}

/**
 * エラーをクリア
 */
function clearError() {
	document.getElementById("codeerror").innerHTML = "";
	document.getElementById("poserror").innerHTML = "";
	if (typeof editor !== 'undefined' && editor.doc) {
		editor.doc.getAllMarks().forEach((marker) => marker.clear());
	}
}

/**
 * 保存
 */
function save() {
	if (typeof editor === 'undefined') return;
	const txt = editor.getValue();
	const blob = new Blob([txt], { type: "text/plain" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "AI.txt";
	a.click();
}

// グローバルに公開（既存コードとの互換性のため）
if (typeof window !== 'undefined') {
	window.init = init;
	window.rematch = rematch;
	window.rematchInit = rematchInit;
	window.config = config;
	window.restart = restart;
	window.sampleset = sampleset;
	window.analysis = analysis;
	window.gameOver = gameOver;
	window.moveMouse = moveMouse;
	window.canvas_resize = canvas_resize;
	window.clearError = clearError;
	window.save = save;

	// グローバル変数も公開
	window.Role = Role;
	window.anaRole = anaRole;
	window.attack_wins = attack_wins;
	window.defense_wins = defense_wins;
	window.gameEndFlag = gameEndFlag;
	window.AIthinkFlag = AIthinkFlag;
	window.restartFlag = restartFlag;
	window.mouseX = mouseX;
	window.mouseY = mouseY;
	window.mouseBlockX = mouseBlockX;
	window.mouseBlockY = mouseBlockY;
}

// window.onload時に初期化
window.onload = function () {
	init();
};

export {
	init,
	rematch,
	rematchInit,
	config,
	restart,
	sampleset,
	analysis,
	gameOver,
	moveMouse,
	canvas_resize,
	clearError,
	save,
};

