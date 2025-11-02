/* --------------------------------------------------------------------------
 * Validation Utility Functions
 * 検証・判定関連のユーティリティ関数
 * -------------------------------------------------------------------------- */

import { distance } from './math.js';
import { arrayTurn } from './gameUtils.js';

/**
 * タグが取られたか判定
 * @param {number} select - 選択中のプレイヤー
 * @param {Array} pos - 位置情報
 * @param {number} turn - ターン (1=アタック, -1=ディフェンス)
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} x - 移動先のx座標
 * @param {number} y - 移動先のy座標
 * @returns {number} 1=タグされた, 0=されていない
 */
export function tagJudge(select, pos, turn, ball, x, y) {
	if (
		Math.abs(pos[arrayTurn(turn)][select][0] - x) <= 1 &&
		Math.abs(pos[arrayTurn(turn)][select][1] - y) <= 1 &&
		[x, y].toString() !== pos[arrayTurn(turn)][select].toString()
	) {
		if (turn == -1 && x == pos[1][ball][0] && y == pos[1][ball][1]) {
			return 1;
		}
	}
	return 0;
}

/**
 * トライしているか判定
 * @param {Array} pos - 位置情報
 * @param {number} ball - ボールを持っているプレイヤー
 * @returns {number} 1=トライ, 0=トライではない
 */
export function tryJudge(pos, ball) {
	if (pos[1][ball][1] == 0) {
		return 1;
	} else {
		return 0;
	}
}

/**
 * 選択した場所がパスできるか判定
 * @param {Array} pos - 位置情報
 * @param {number} turn - ターン (1=アタック, -1=ディフェンス)
 * @param {number} select - 選択中のプレイヤー
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} x - 選択位置のx座標
 * @param {number} y - 選択位置のy座標
 * @returns {number} 受け手のプレイヤー番号、または-1（パス不可）
 */
export function catchable(pos, turn, select, ball, x, y) {
	if (turn == 1 && select == ball) {
		for (let i = 0; i < pos[1].length; i++) {
			if (
				pos[1][i][0] == x &&
				pos[1][i][1] == y &&
				pos[1][i][1] >= pos[1][select][1] &&
				i != select
			) {
				return i;
			}
		}
	}
	return -1;
}

/**
 * ディフェンスまでの距離配列を取得
 * @param {Array} pos - 位置情報
 * @param {number} x - 対象位置のx座標
 * @param {number} y - 対象位置のy座標
 * @returns {number[]} ディフェンスまでの距離配列
 */
export function getDefenseDistanceArray(pos, x, y) {
	const disDefenseArr = [];
	for (let j = 0; j < pos[0].length; j++) {
		disDefenseArr.push(distance(x - pos[0][j][0], y - pos[0][j][1]));
	}
	return disDefenseArr;
}

/**
 * アタックまでの距離配列を取得
 * @param {Array} pos - 位置情報
 * @param {number} x - 対象位置のx座標
 * @param {number} y - 対象位置のy座標
 * @returns {number[]} アタックまでの距離配列
 */
export function getAttackDistanceArray(pos, x, y) {
	const disAttackArr = [];
	for (let j = 0; j < pos[1].length; j++) {
		disAttackArr.push(distance(x - pos[1][j][0], y - pos[1][j][1]));
	}
	return disAttackArr;
}

/**
 * 距離配列をチェック（2未満の距離があるか）
 * @param {number[]} disDefenseArr - 距離配列
 * @returns {number} 1=2未満の距離がある, 0=ない
 */
export function checkDistance(disDefenseArr) {
	for (let j = 0; j < disDefenseArr.length; j++) {
		if (disDefenseArr[j] < 2) {
			return 1;
		}
	}
	return 0;
}

