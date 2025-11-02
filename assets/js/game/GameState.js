/* --------------------------------------------------------------------------
 * Game State
 * ゲーム状態を管理するクラス
 * -------------------------------------------------------------------------- */

import { copyArray } from '../utils/array.js';
import { InitialPositions, GameRules } from '../config/GameConfig.js';

/**
 * ゲーム状態を管理するクラス
 */
export class GameState {
	constructor(attackAI, defenseAI) {
		this.init(attackAI, defenseAI);
	}

	/**
	 * ゲームを初期化
	 * @param {string} attackAI - 攻め手AI名
	 * @param {string} defenseAI - 守り手AI名
	 */
	init(attackAI, defenseAI) {
		// AIの初期化
		this.Role = [];
		this.Role[1] = attackAI;
		this.Role[0] = defenseAI;
		// パラメータの初期化
		this.turn = 1; // ターン(1がアタック、-1がディフェンス)
		// コマの位置の初期化
		this.pos = [];
		this.pos[0] = copyArray(InitialPositions.POSDEFENSE);
		this.pos[1] = copyArray(InitialPositions.POSATTACK);
		this.select = 0;
		this.ball = 0;
		this.step = 0;
		this.tag = GameRules.MAXTAG;
		this.nextmove = []; // 次の一手の配列
		this.eval_list = []; // 評価値リストの配列
		this.wait = -1;
		this.tagged = 0;
		this.tagged_disp = 0;
	}

	/**
	 * ゲーム状態をリセット（リマッチ用）
	 */
	reset() {
		this.turn = 1;
		this.pos[0] = copyArray(InitialPositions.POSDEFENSE);
		this.pos[1] = copyArray(InitialPositions.POSATTACK);
		this.select = 0;
		this.ball = 0;
		this.step = 0;
		this.tag = GameRules.MAXTAG;
		this.wait = -1;
		this.tagged = 0;
		this.tagged_disp = 0;
	}
}

