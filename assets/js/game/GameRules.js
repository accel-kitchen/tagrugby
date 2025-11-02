/* --------------------------------------------------------------------------
 * Game Rules
 * ゲームルール（パス成功率など）を管理
 * -------------------------------------------------------------------------- */

import { catchProb, probJudge } from '../utils/math.js';
import { GameRules } from '../config/GameConfig.js';

/**
 * パスを試行し、成功/失敗を判定
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} catcher - 受け手のプレイヤー番号
 * @param {number} x1 - 送り手のx座標
 * @param {number} y1 - 送り手のy座標
 * @param {number} x2 - 受け手のx座標
 * @param {number} y2 - 受け手のy座標
 * @param {number} wait - 現在の待機プレイヤー番号
 * @returns {number} 待機プレイヤー番号（失敗時は受け手、成功時は-1）
 */
export function tryCatch(ball, catcher, x1, y1, x2, y2, wait) {
	if (probJudge(catchProb(x1, y1, x2, y2, GameRules.CATCH_PROBABILITY_LIST))) {
		document.getElementById("pass").innerHTML = "パス成功！";
		return -1;
	} else {
		wait = catcher;
		document.getElementById("pass").innerHTML = "パス失敗！";
		return wait;
	}
}

