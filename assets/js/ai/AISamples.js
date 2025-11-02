/* --------------------------------------------------------------------------
 * AI Sample Implementations
 * サンプルAIの実装
 * -------------------------------------------------------------------------- */

import { registerAI } from './AIRegistry.js';
import { getMovableList, checkMate } from '../game/ActionValidator.js';
import { distance } from '../utils/math.js';
import { posSortTraverse } from '../game/AIParameterHelper.js';
import { arrayTurn } from '../utils/gameUtils.js';
import { BoardConfig } from '../config/GameConfig.js';

/**
 * 攻め手AI（エディタから読み込まれる）
 * この関数はeval()で実行されるコードを呼び出す
 */
function AttackAI(pos, turn, select, ball, tagged) {
	// この関数はTagRugby-core.jsで実装される
	// editor.getValue()で取得したコードを実行
	throw new Error('AttackAIはTagRugby-core.jsで実装される必要があります');
}

/**
 * 守り手サンプル1: ボールに最も近づく
 */
function DefenseSample1(pos, turn, select, ball, tagged) {
	let eval_list = []; // 評価値リストの初期化
	const movablelist = getMovableList(pos, turn, select, tagged, BoardConfig.BOARDSIZE); // 動ける場所のリスト

	const [checkmateFlag, x, y] = checkMate(pos, turn, select, ball); // checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
	// トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag) {
		return [[x, y], eval_list];
	}

	// ディフェンスの場合：dis_ball(ボールまでの距離)が一番近くなるような移動をする
	if (turn == -1) {
		for (let i = 0; i < movablelist.length; i++) {
			const dis_ball = distance(
				movablelist[i][0] - pos[1][ball][0],
				movablelist[i][1] - pos[1][ball][1]
			);
			eval_list.push(-dis_ball + 0.1 * Math.random());
		}
	}
	const best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list)); // 評価値が最も大きい候補の番号を得る
	const best_move_array = [
		movablelist[best_move_index][0],
		movablelist[best_move_index][1],
	]; // 評価値が最も大きい候補の動く場所を返す

	return [best_move_array, eval_list]; // 結果を返す
}

/**
 * 守り手サンプル2: マンツーマンディフェンス
 */
function DefenseSample2(pos, turn, select, ball, tagged) {
	let eval_list = []; // 評価値リストの初期化
	const movablelist = getMovableList(pos, turn, select, tagged, BoardConfig.BOARDSIZE); // 動ける場所のリスト

	const [checkmateFlag, x, y] = checkMate(pos, turn, select, ball); // checkmateFlagはトライorインターセプトできるかのフラグ、x,yがその場合の動く先
	// トライorインターセプトができる場合はその行動を返す
	if (checkmateFlag) {
		return [[x, y], eval_list];
	}

	// ディフェンスの場合：エージェント自身が左からn番目にいる場合、相手の左からn番目に近づく
	const [defenseLine, attackLine] = posSortTraverse(pos); // defenseLine,attackLineはそれぞれ左からエージェントのIDをリストにしたもの。
	const charge = attackLine[defenseLine[select]]; // chargeは自分のマークする相手のエージェント。
	for (let i = 0; i < movablelist.length; i++) {
		const dis_ball = distance(
			movablelist[i][0] - pos[1][charge][0],
			movablelist[i][1] - pos[1][charge][1]
		);
		eval_list.push(-dis_ball + 0.1 * Math.random());
	}

	const best_move_index = eval_list.indexOf(Math.max.apply(null, eval_list));
	const best_move_array = [
		movablelist[best_move_index][0],
		movablelist[best_move_index][1],
	];

	return [best_move_array, eval_list];
}

// AIを登録
registerAI('DefenseSample1', DefenseSample1);
registerAI('DefenseSample2', DefenseSample2);

// AttackAIはTagRugby-core-v2.jsで登録される（エディタからコードを実行するため）

