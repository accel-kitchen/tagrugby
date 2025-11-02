/* --------------------------------------------------------------------------
 * UI Refresher
 * UIパラメータの更新を管理
 * -------------------------------------------------------------------------- */

import { getParamForMove, getParamForThrow } from '../game/AIParameterHelper.js';
import { getPassList } from '../game/ActionValidator.js';

/**
 * UIパラメータを更新する関数
 * @param {Object} gameState - ゲーム状態
 */
/**
 * UIパラメータを更新する関数
 * @param {Object} gameState - ゲーム状態
 */
export function refreshParam(gameState) {
	const [
		distance_defense, // 守り手までの距離（配列）
		distance_defense_min, // 守り手までの最小距離
		back_forth_from_goalline, // ゴールラインに対する前後の移動距離（前は１、後ろはー１、横は０）
		horizontal_diff_from_ball, // ボールを持っているプレイヤーとの横方向の距離
		vertical_diff_from_ball, // ボールを持っているプレイヤーとの縦方向の距離
		defenseLine, // 守り手の左からの順番を表した配列
		attackLine, // 攻め手の左からの順番を表した配列
		deviation_from_uniform_position, // 均等に横方向に並ぶ場合の場所からのずれ
	] = getParamForMove(
		gameState.pos,
		gameState.ball,
		gameState.pos[(gameState.turn + 1) / 2][gameState.select][0],
		gameState.pos[(gameState.turn + 1) / 2][gameState.select][1],
		gameState.select
	);

	// 既存コードとの互換性のため、グローバルスコープに公開
	if (typeof window !== 'undefined') {
		window.distance_defense = distance_defense;
		window.distance_defense_min = distance_defense_min;
		window.back_forth_from_goalline = back_forth_from_goalline;
		window.horizontal_diff_from_ball = horizontal_diff_from_ball;
		window.vertical_diff_from_ball = vertical_diff_from_ball;
		window.defenseLine = defenseLine;
		window.attackLine = attackLine;
		window.deviation_from_uniform_position = deviation_from_uniform_position;
	}

	document.getElementById("param_step").innerHTML = gameState.step;

	for (let i = 0, len = 4; i <= len; i++) {
		document
			.getElementById("param_ball_" + i)
			.classList.remove("paramBadgeSelected");
	}
	document
		.getElementById("param_ball_" + gameState.ball)
		.classList.add("paramBadgeSelected");

	for (let i = 0, len = 4; i <= len; i++) {
		document
			.getElementById("param_select_" + i)
			.classList.remove("paramBadgeSelected");
	}
	document
		.getElementById("param_select_" + gameState.select)
		.classList.add("paramBadgeSelected");
	for (let i = 1, len = 4; i <= len; i++) {
		document
			.getElementById("param_tag_" + i)
			.classList.remove("paramBadgeSelected");
	}
	document
		.getElementById("param_tag_" + gameState.tag)
		.classList.add("paramBadgeSelected");

	if (gameState.wait !== -1) {
		document
			.getElementById("param_wait_0")
			.classList.remove("paramBadgeSelected");
		document.getElementById("param_wait_1").classList.add("paramBadgeSelected");
	} else {
		document
			.getElementById("param_wait_1")
			.classList.remove("paramBadgeSelected");
		document.getElementById("param_wait_0").classList.add("paramBadgeSelected");
	}

	if (gameState.tagged) {
		document
			.getElementById("param_tagged_0")
			.classList.remove("paramBadgeSelected");
		document
			.getElementById("param_tagged_1")
			.classList.add("paramBadgeSelected");
	} else {
		document
			.getElementById("param_tagged_1")
			.classList.remove("paramBadgeSelected");
		document
			.getElementById("param_tagged_0")
			.classList.add("paramBadgeSelected");
	}

	if (gameState.turn === 1) {
		document
			.getElementById("param_turn_0")
			.classList.remove("paramBadgeSelected");
		document.getElementById("param_turn_1").classList.add("paramBadgeSelected");
	} else {
		document
			.getElementById("param_turn_1")
			.classList.remove("paramBadgeSelected");
		document.getElementById("param_turn_0").classList.add("paramBadgeSelected");
	}
	for (let i = 0, len = distance_defense.length - 1; i <= len; i++) {
		document.getElementById("param_distance_" + i).innerHTML =
			distance_defense[i].toFixed(1);
	}
	document.getElementById("param_distance_defense_min").innerHTML =
		distance_defense_min.toFixed(1);
	document.getElementById("param_horizontal_diff_from_ball").innerHTML =
		horizontal_diff_from_ball;
	document.getElementById("param_vertical_diff_from_ball").innerHTML =
		vertical_diff_from_ball;
	for (let i = 0, len = defenseLine.length - 1; i <= len; i++) {
		document.getElementById("param_defenseLine_" + i).innerHTML =
			defenseLine[i];
	}
	for (let i = 0, len = attackLine.length - 1; i <= len; i++) {
		document.getElementById("param_attackLine_" + i).innerHTML = attackLine[i];
	}
	document.getElementById("param_deviation_from_uniform_position").innerHTML =
		deviation_from_uniform_position;

	const passlist = getPassList(gameState.pos, gameState.turn, gameState.select, gameState.ball); // パスの候補場所配列を作成
	
	// パス関連の変数をグローバルスコープに公開
	let distance_defense_throw_min = 0;
	let pass_distance = 0; // 最新のpass_distanceを保持
	let distance_defense_catch_min = 0; // 最新のdistance_defense_catch_minを保持
	if (typeof window !== 'undefined') {
		window.passlist = passlist;
	}
	
	for (let i = 0; i <= gameState.pos[1].length - 1; i++) {
		// パス場所に対して順番に評価値を調べる
		const [
			distance_defense_throw_min_i, // ボールを持っているプレイヤーとディフェンスとの最短距離
			pass_distance_i, // パスが成功する確率
			distance_defense_catch_min_i, // パスを受けるプレイヤーとディフェンスとの最短距離
		] = getParamForThrow(
			gameState.pos,
			gameState.ball,
			i,
			gameState.pos[1][i][0],
			gameState.pos[1][i][1],
			gameState.select
		);
		if (typeof window !== 'undefined') {
			window['distance_defense_catch_min_' + i] = distance_defense_catch_min_i;
			window['pass_distance_' + i] = pass_distance_i;
			// 最新の値をグローバルスコープに公開（AIコードからアクセスできるように）
			pass_distance = pass_distance_i;
			distance_defense_catch_min = distance_defense_catch_min_i;
			window.pass_distance = pass_distance;
			window.distance_defense_catch_min = distance_defense_catch_min;
		}
		document.getElementById("param_distance_defense_catch_min_" + i).innerHTML =
			distance_defense_catch_min_i.toFixed(1);
		document.getElementById("param_pass_distance_" + i).innerHTML =
			pass_distance_i.toFixed(1);
	}
	const [distance_defense_throw_min_final] = getParamForThrow(
		gameState.pos,
		gameState.ball,
		0,
		gameState.pos[1][0][0],
		gameState.pos[1][0][1],
		gameState.select
	);
	distance_defense_throw_min = distance_defense_throw_min_final;
	if (typeof window !== 'undefined') {
		window.distance_defense_throw_min = distance_defense_throw_min;
		// 最後のpass_distanceとdistance_defense_catch_minも公開（念のため）
		if (pass_distance === 0 && gameState.pos[1].length > 0) {
			const [_, pass_distance_last, distance_defense_catch_min_last] = getParamForThrow(
				gameState.pos,
				gameState.ball,
				gameState.pos[1].length - 1,
				gameState.pos[1][gameState.pos[1].length - 1][0],
				gameState.pos[1][gameState.pos[1].length - 1][1],
				gameState.select
			);
			window.pass_distance = pass_distance_last;
			window.distance_defense_catch_min = distance_defense_catch_min_last;
		}
	}
	document.getElementById("param_distance_defense_throw_min").innerHTML =
		distance_defense_throw_min.toFixed(1);
}

