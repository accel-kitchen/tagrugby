/* --------------------------------------------------------------------------
 * Action Validator
 * アクション（移動・パス）の検証を行う
 * -------------------------------------------------------------------------- */

import { arrayTurn } from '../utils/gameUtils.js';
import { GameRules, MAX_PASS_LENGTH } from '../config/GameConfig.js';
import { distance as calcDistance } from '../utils/math.js';

/**
 * 移動可能な場所のリストを取得
 * @param {Array} pos - 位置情報
 * @param {number} turn - ターン (1=アタック, -1=ディフェンス)
 * @param {number} select - 選択中のプレイヤー
 * @param {number} tagged - タグされたか (1=タグされた, 0=されていない)
 * @param {number} boardsize - ボードサイズ
 * @returns {Array} 移動可能な位置の配列 [[x, y], ...]
 */
export function getMovableList(pos, turn, select, tagged, boardsize) {
	if (tagged == 1) {
		return [];
	}
	const movablelist = [];
	for (let i = -1; i <= 1; i++) {
		overlapSpace: for (let j = -1; j <= 1; j++) {
			if (
				!(i == 0 && j == 0) &&
				pos[arrayTurn(turn)][select][0] + i >= 0 &&
				pos[arrayTurn(turn)][select][0] + i < boardsize &&
				pos[arrayTurn(turn)][select][1] + j >= 0 &&
				pos[arrayTurn(turn)][select][1] + j < boardsize
			) {
				// ディフェンスとの重複チェック
				for (let k = 0; k < pos[0].length; k++) {
					if (
						pos[arrayTurn(turn)][select][0] + i == pos[0][k][0] &&
						pos[arrayTurn(turn)][select][1] + j == pos[0][k][1]
					) {
						continue overlapSpace;
					}
				}
				// アタックとの重複チェック
				for (let k = 0; k < pos[1].length; k++) {
					if (
						pos[arrayTurn(turn)][select][0] + i == pos[1][k][0] &&
						pos[arrayTurn(turn)][select][1] + j == pos[1][k][1]
					) {
						continue overlapSpace;
					}
				}
				movablelist.push([
					pos[arrayTurn(turn)][select][0] + i,
					pos[arrayTurn(turn)][select][1] + j,
				]);
			}
		}
	}
	return movablelist;
}

/**
 * パスできる場所のリストを取得
 * @param {Array} pos - 位置情報
 * @param {number} turn - ターン (1=アタック, -1=ディフェンス)
 * @param {number} select - 選択中のプレイヤー
 * @param {number} ball - ボールを持っているプレイヤー
 * @returns {Array} パス可能な位置の配列 [[x, y], ...]
 */
export function getPassList(pos, turn, select, ball) {
	const passlist = [];
	if (select == ball) {
		// ボールを投げるか判断
		for (let i = 0; i < pos[1].length; i++) {
			if (
				turn == 1 &&
				i != select &&
				pos[1][select][1] <= pos[1][i][1] &&
				calcDistance(
					pos[1][select][0] - pos[1][i][0],
					pos[1][select][1] - pos[1][i][1]
				) <= MAX_PASS_LENGTH
			) {
				passlist.push([pos[1][i][0], pos[1][i][1]]); // 投げる候補の追加
			}
		}
	}
	return passlist;
}

/**
 * トライまたはインターセプトできるかチェック
 * @param {Array} pos - 位置情報
 * @param {number} turn - ターン (1=アタック, -1=ディフェンス)
 * @param {number} select - 選択中のプレイヤー
 * @param {number} ball - ボールを持っているプレイヤー
 * @returns {Array} [checkmateFlag, x, y] checkmateFlag=1なら可能、x,yはその場合の移動先
 */
export function checkMate(pos, turn, select, ball) {
	if (turn == -1) {
		// ディフェンスの場合：インターセプト可能かチェック
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (
					pos[arrayTurn(turn)][select][0] + i == pos[1][ball][0] &&
					pos[arrayTurn(turn)][select][1] + j == pos[1][ball][1]
				) {
					return [
						1,
						pos[arrayTurn(turn)][select][0] + i,
						pos[arrayTurn(turn)][select][1] + j,
					];
				}
			}
		}
	} else if (turn == 1) {
		// アタックの場合：トライ可能かチェック
		if (pos[1][select][1] <= 1 && select == ball) {
			return [1, pos[1][select][0], 0];
		}
	}
	return [0, 0, 0];
}

