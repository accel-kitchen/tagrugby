/* --------------------------------------------------------------------------
 * Turn Manager
 * ターン管理とフェーズ遷移を行う
 * -------------------------------------------------------------------------- */

import { arrayTurn } from '../utils/gameUtils.js';

/**
 * 次のターンへ移行する関数
 * @param {number} select - 現在の選択プレイヤー
 * @param {Array} pos - 位置情報
 * @param {number} turn - 現在のターン (1=アタック, -1=ディフェンス)
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} tagged - タグされたか (1=タグされた, 0=されていない)
 * @returns {Array} [select, turn, tagged]
 */
export function stepPhase(select, pos, turn, ball, tagged) {
	if (turn == 1) {
		if (
			select > pos[arrayTurn(turn * -1)].length - 1 &&
			select < pos[arrayTurn(turn)].length - 1
		) {
			select += 1;
		} else {
			turn *= -1;
		}
	} else {
		if (
			select >= pos[arrayTurn(turn * -1)].length - 1 &&
			select < pos[arrayTurn(turn)].length - 1
		) {
			select += 1;
		} else {
			if (select >= pos[arrayTurn(turn * -1)].length - 1) {
				turn *= -1;
				select = 0;
			} else {
				turn *= -1;
				select += 1;
			}
		}
	}

	tagged = 0;

	return [select, turn, tagged];
}

/**
 * タグされた時に次のターンへ移行する関数
 * @param {number} select - 現在の選択プレイヤー
 * @param {Array} pos - 位置情報
 * @param {number} turn - 現在のターン (1=アタック, -1=ディフェンス)
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} tagged - タグされたか (1=タグされた, 0=されていない)
 * @returns {Array} [select, turn, tagged]
 */
export function taggedStepPhase(select, pos, turn, ball, tagged) {
	return [ball, 1, 1];
}

