/* --------------------------------------------------------------------------
 * AI Parameter Helper
 * AI評価に必要なパラメータを取得する関数
 * -------------------------------------------------------------------------- */

import { distance } from '../utils/math.js';
import { getDefenseDistanceArray } from '../utils/validation.js';
import { xsort, transpose, addIndex } from '../utils/array.js';
import { copyArray } from '../utils/array.js';
import { BoardConfig } from '../config/GameConfig.js';
import { checkMate as defaultCheckMate } from '../game/ActionValidator.js';

/**
 * ボールとの前後の距離を計算
 */
function backForthBall(pos, ball, select, y) {
	if (ball == select) {
		return [0, 0];
	} else {
		if (pos[1][ball][1] > y) {
			return [pos[1][ball][1] - y, 0];
		} else {
			return [0, y - pos[1][ball][1]];
		}
	}
}

/**
 * ボールとの横縦の距離を計算
 */
function diffFromBall(pos, ball, select, x, y) {
	return [Math.abs(x - pos[1][ball][0]), y - pos[1][ball][1]];
}

/**
 * AIに必要なパラメータを取得（移動用）
 * @param {Array} pos - 位置情報
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} x - 対象位置のx座標
 * @param {number} y - 対象位置のy座標
 * @param {number} select - 選択中のプレイヤー
 * @returns {Array} [distance_defense, distance_defense_min, back_forth_from_goalline, horizontal_diff_from_ball, vertical_diff_from_ball, defenseLine, attackLine, deviation_from_uniform_position]
 */
export function getParamForMove(pos, ball, x, y, select) {
	const distance_defense = getDefenseDistanceArray(pos, x, y); // ディフェンスとの距離リスト
	const distance_defense_min = Math.min.apply(null, distance_defense); // ディフェンスとの最小距離
	const back_forth_from_goalline = -(y - pos[1][select][1]); // ゴールラインに対する前後の移動距離
	const [horizontal_diff_from_ball, vertical_diff_from_ball] = diffFromBall(
		pos,
		ball,
		select,
		x,
		y
	);
	const [defenseLine, attackLine] = posSortTraverse(pos); // defenseLine,attackLineはそれぞれ左からエージェントのIDをリストにしたもの。

	// window.BOARDSIZEが設定されている場合はそれを使用、なければBoardConfig.BOARDSIZEを使用
	const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : BoardConfig.BOARDSIZE;
	const deviation_from_uniform_position = Math.abs(
		(attackLine[select] / (pos[1].length - 1)) * boardsize - x
	); // 均等に横方向に並ぶ場合の場所からのずれ
	return [
		distance_defense,
		distance_defense_min,
		back_forth_from_goalline,
		horizontal_diff_from_ball,
		vertical_diff_from_ball,
		defenseLine,
		attackLine,
		deviation_from_uniform_position,
	];
}

/**
 * AIのthrow評価に必要なパラメータを取得
 * @param {Array} pos - 位置情報
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} i - 対象プレイヤー番号
 * @param {number} x - 対象位置のx座標
 * @param {number} y - 対象位置のy座標
 * @param {number} select - 選択中のプレイヤー
 * @returns {Array} [distance_defense_throw_min, pass_distance, distance_defense_catch_min]
 */
export function getParamForThrow(pos, ball, i, x, y, select) {
	const distance_defense_throw_min = Math.min.apply(
		null,
		getDefenseDistanceArray(pos, pos[1][ball][0], pos[1][ball][1])
	); // ボールを持っているプレイヤーとディフェンスとの最短距離
	const pass_distance = distance(x - pos[1][select][0], y - pos[1][select][1]); // パスが成功する確率
	const distance_defense_catch_min = Math.min.apply(
		null,
		getDefenseDistanceArray(pos, x, y)
	); // パスを受けるプレイヤーとディフェンスとの最短距離

	return [
		distance_defense_throw_min,
		pass_distance,
		distance_defense_catch_min,
	];
}

/**
 * ディフェンスとアタックのそれぞれ左から右に向かってどのプレイヤーが並んでいるかの配列を返す
 * @param {Array} pos - 位置情報
 * @returns {Array} [defenseLine, attackLine]
 */
export function posSortTraverse(pos) {
	const sort = [[], []];
	const attackAddIndex = addIndex(copyArray(pos[1]));
	const defenseAddIndex = addIndex(copyArray(pos[0]));
	const attackSort = xsort(copyArray(attackAddIndex), 0, 1);
	const defenseSort = xsort(copyArray(defenseAddIndex), 0, 1);
	return [transpose(defenseSort)[2], transpose(attackSort)[2]];
}

/**
 * x,yの位置に対してディフェンスまでの距離の合計を返す
 * @param {number} x - 対象位置のx座標
 * @param {number} y - 対象位置のy座標
 * @param {Array} pos - 位置情報
 * @returns {number} 距離の合計、または-1（距離2未満がある場合）
 */
export function disDefense(x, y, pos) {
	const dis_defense = getDefenseDistanceArray(pos, x, y);
	let dis_defense_sum = 0;
	for (let j = 0; j < dis_defense.length; j++) {
		if (dis_defense[j] < 2) {
			return -1;
		} else {
			dis_defense_sum += dis_defense[j];
		}
	}
	return dis_defense_sum;
}

/**
 * 最善手を返す
 * @param {Array} movablelist - 移動可能な場所のリスト
 * @param {Array} passlist - パス可能な場所のリスト
 * @param {Array} pos - 位置情報
 * @param {number} turn - ターン (1=アタック, -1=ディフェンス)
 * @param {number} select - 選択中のプレイヤー
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {Array} eval_list - 評価値リスト
 * @param {Function} checkMateFunc - チェックメイト判定関数（省略可能、グローバルのCheckMateFuncを使用）
 * @returns {Array} [best_move_array, eval_list]
 */
export function returnResult(movablelist, passlist, pos, turn, select, ball, eval_list, checkMateFunc) {
	// checkMateFuncが渡されていない場合はデフォルトのcheckMate関数を使用
	if (!checkMateFunc) {
		// まずグローバルのCheckMateFuncを試す
		if (typeof window !== 'undefined' && typeof window.CheckMateFunc === 'function') {
			checkMateFunc = window.CheckMateFunc;
		} else {
			// グローバルにない場合はインポートしたデフォルト関数を使用
			checkMateFunc = defaultCheckMate;
		}
	}
	
	// checkMateFuncが関数でない場合はエラーをスロー
	if (typeof checkMateFunc !== 'function') {
		console.error('checkMateFunc is not a function:', {
			checkMateFuncType: typeof checkMateFunc,
			checkMateFuncValue: checkMateFunc,
			windowCheckMateFuncType: typeof window !== 'undefined' ? typeof window.CheckMateFunc : 'N/A',
			defaultCheckMateType: typeof defaultCheckMate
		});
		throw new Error('checkMateFunc is not a function: ' + typeof checkMateFunc);
	}
	
	// トライorインターセプトができる場合はその行動を返す
	try {
		const result = checkMateFunc(pos, turn, select, ball);
		// 返り値が配列でない場合のチェック
		if (!Array.isArray(result) || result.length < 3) {
			console.error('checkMateFunc returned invalid result:', result);
			throw new Error('checkMateFunc returned invalid result: expected array with 3 elements');
		}
		const [checkmateFlag, x, y] = result;
		if (checkmateFlag == 1) {
			return [[x, y], eval_list];
		}
	} catch (error) {
		console.error('Error calling checkMateFunc:', error);
		throw error;
	}

	// 最善手を探して手を決める
	const best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list)); // 評価値が最大値をとる手を選ぶ
	let action_list = []; // 候補手配列を生成
	action_list = action_list.concat(movablelist); // 候補手配列に移動の候補場所を追加
	action_list = action_list.concat(passlist); // 候補手配列にパスの候補場所を追加
	const best_move_array = [
		// 最も評価値が大きい手を選ぶ
		action_list[best_move_index][0],
		action_list[best_move_index][1],
	];
	return [best_move_array, eval_list]; // 評価値が最大の場所と評価値配列を返す
}

