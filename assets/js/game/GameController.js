/* --------------------------------------------------------------------------
 * Game Controller
 * ゲームの制御を管理するクラス
 * GameStateと組み合わせて使用
 * -------------------------------------------------------------------------- */

import { GameState } from './GameState.js';
import { getMovableList, getPassList, checkMate } from './ActionValidator.js';
import { stepPhase, taggedStepPhase } from './TurnManager.js';
import { tryCatch } from './GameRules.js';
import { tagJudge, tryJudge, catchable } from '../utils/validation.js';
import { arrayTurn } from '../utils/gameUtils.js';
import { copyArray } from '../utils/array.js';
import { rugby_AI } from '../ai/AIRegistry.js';
import { GameConfig } from '../config/GameConfig.js';

/**
 * ゲームを制御するクラス
 * 既存のGameクラスとの互換性を保つ
 */
export class GameController {
	constructor(attackAI, defenseAI) {
		this.gameState = new GameState(attackAI, defenseAI);
		this.init(attackAI, defenseAI);
	}

	/**
	 * ゲームを初期化
	 * @param {string} attackAI - 攻め手AI名
	 * @param {string} defenseAI - 守り手AI名
	 */
	init(attackAI, defenseAI) {
		this.gameState.init(attackAI, defenseAI);
		this.tagged_disp = 0;
	}

	// 既存コードとの互換性のため、GameStateのプロパティに直接アクセスできるようにする
	get turn() { return this.gameState.turn; }
	set turn(value) { this.gameState.turn = value; }
	get pos() { return this.gameState.pos; }
	set pos(value) { this.gameState.pos = value; }
	get select() { return this.gameState.select; }
	set select(value) { this.gameState.select = value; }
	get ball() { return this.gameState.ball; }
	set ball(value) { this.gameState.ball = value; }
	get step() { return this.gameState.step; }
	set step(value) { this.gameState.step = value; }
	get tag() { return this.gameState.tag; }
	set tag(value) { this.gameState.tag = value; }
	get wait() { return this.gameState.wait; }
	set wait(value) { this.gameState.wait = value; }
	get tagged() { return this.gameState.tagged; }
	set tagged(value) { this.gameState.tagged = value; }
	get Role() { return this.gameState.Role; }
	set Role(value) { this.gameState.Role = value; }

	/**
	 * 人間のターン処理
	 * @param {number} x - クリック位置のx座標
	 * @param {number} y - クリック位置のy座標
	 * @param {Function} drawFunc - 描画関数
	 * @param {Function} gameOverFunc - ゲーム終了関数
	 * @param {Object} appState - アプリケーション状態
	 */
	humanTurn(x, y, drawFunc, gameOverFunc, appState) {
		if (this.select == 0 && this.turn == 1) {
			this.step += 1;
		}
		const movablelist = getMovableList(
			copyArray(this.pos),
			this.turn,
			this.select,
			this.tagged,
			GameConfig.BoardConfig.BOARDSIZE
		);
		const passlist = getPassList(
			copyArray(this.pos),
			this.turn,
			this.select,
			this.ball
		);

		// 一回休みの場合の処理
		if (this.select == this.wait) {
			this.wait = -1;
			[this.select, this.turn, this.tagged] = stepPhase(
				this.select,
				this.pos,
				this.turn,
				this.ball,
				this.tagged
			);
		}
		// 動ける場所がない場合の処理
		else if (movablelist.length == 0 && passlist.length == 0) {
			document.getElementById("pass").innerHTML = "動けるところがないので1回休み";
			[this.select, this.turn, this.tagged] = stepPhase(
				this.select,
				this.pos,
				this.turn,
				this.ball,
				this.tagged
			);
		}
		// タグが取られた場合の処理
		else if (tagJudge(this.select, this.pos, this.turn, this.ball, x, y)) {
			if (this.tag == 1) {
				gameOverFunc(-1, x, y);
				return;
			} else {
				this.tag -= 1;
				this.tagged = 1;
				this.tagged_disp = 1;
				let tag = "";
				for (let i = 0; i < this.tag; i++) {
					tag += GameConfig.TAG_IMG;
				}
				document.getElementById("tag").innerHTML = tag;
				[this.select, this.turn, this.tagged] = taggedStepPhase(
					this.select,
					this.pos,
					this.turn,
					this.ball,
					this.tagged
				);
			}
		} else {
			const catchableResult = catchable(this.pos, this.turn, this.select, this.ball, x, y);
			// パスした場合の処理
			if (catchableResult != -1) {
				this.wait = tryCatch(
					this.ball,
					catchableResult,
					x,
					y,
					this.pos[this.turn][this.select][0],
					this.pos[this.turn][this.select][1],
					this.wait
				);
				this.ball = catchableResult;
				[this.select, this.turn, this.tagged] = stepPhase(
					this.select,
					this.pos,
					this.turn,
					this.ball,
					this.tagged
				);
			}
			// 移動する場合の処理
			else {
				for (let i = 0; i < movablelist.length; i++) {
					if (x == movablelist[i][0] && y == movablelist[i][1]) {
						this.pos[arrayTurn(this.turn)][this.select][0] = x;
						this.pos[arrayTurn(this.turn)][this.select][1] = y;
						[this.select, this.turn, this.tagged] = stepPhase(
							this.select,
							this.pos,
							this.turn,
							this.ball,
							this.tagged
						);
					}
				}
				// トライした場合の処理
				if (tryJudge(this.pos, this.ball)) {
					gameOverFunc(1, x, y);
					return;
				}
			}
		}
		if (this.Role[arrayTurn(this.turn)] != "human") {
			if (appState) {
				appState.AIthinkFlag = 1;
				// window.DELAYDURATIONが設定されている場合はそれを使用、なければデフォルト値を使用
				const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
					? window.DELAYDURATION 
					: GameConfig.TimingConfig.DELAYDURATION;
				setTimeout(() => {
					this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
				}, delayDuration);
			}
		}
		if (drawFunc) {
			drawFunc();
		}
		return;
	}

	/**
	 * AIのターン処理
	 * @param {Function} drawFunc - 描画関数
	 * @param {Function} gameOverFunc - ゲーム終了関数
	 * @param {Object} appState - アプリケーション状態
	 * @param {Array} Role - ロール配列（既存コードとの互換性のため）
	 */
	AIturn(drawFunc, gameOverFunc, appState, Role) {
		// clearError()は既存コードで実装されていると仮定
		if (typeof window.clearError === 'function') {
			window.clearError();
		}

		// AIの思考
		if (this.select == 0 && this.turn == 1) {
			this.step += 1;
		}
		const AI_name = Role ? Role[arrayTurn(this.turn)] : this.Role[arrayTurn(this.turn)];
		let nextmove = [];
		let eval_list = [];

		const movablelist = getMovableList(
			copyArray(this.pos),
			this.turn,
			this.select,
			this.tagged,
			GameConfig.BoardConfig.BOARDSIZE
		);
		const passlist = getPassList(
			copyArray(this.pos),
			this.turn,
			this.select,
			this.ball
		);

		if (movablelist.length != 0 || passlist.length != 0) {
			const aiFunc = rugby_AI[AI_name];
			if (aiFunc) {
				[nextmove, eval_list] = aiFunc(
					this.pos,
					this.turn,
					this.select,
					this.ball,
					this.tagged
				);
			}
		}

		if (
			nextmove.length == 0 ||
			typeof nextmove[0] === "undefined" ||
			typeof nextmove[1] === "undefined"
		) {
			[this.select, this.turn, this.tagged] = stepPhase(
				this.select,
				this.pos,
				this.turn,
				this.ball,
				this.tagged
			);
		}
		// 一回休みの場合の処理
		else if (this.select == this.wait) {
			this.wait = -1;
			[this.select, this.turn, this.tagged] = stepPhase(
				this.select,
				this.pos,
				this.turn,
				this.ball,
				this.tagged
			);
		}
		// 動ける場所がない場合の処理
		else if (movablelist.length == 0 && passlist.length == 0) {
			[this.select, this.turn, this.tagged] = stepPhase(
				this.select,
				this.pos,
				this.turn,
				this.ball,
				this.tagged
			);
		}
		// タグが取られた場合の処理
		else if (
			tagJudge(
				this.select,
				this.pos,
				this.turn,
				this.ball,
				nextmove[0],
				nextmove[1]
			)
		) {
			if (this.tag == 1) {
				gameOverFunc(-1, nextmove[0], nextmove[1]);
				return;
			} else {
				this.tag -= 1;
				this.tagged = 1;
				this.tagged_disp = 1;
				let tag = "";
				for (let i = 0; i < this.tag; i++) {
					tag += GameConfig.TAG_IMG;
				}
				document.getElementById("tag").innerHTML = tag;
				[this.select, this.turn, this.tagged] = taggedStepPhase(
					this.select,
					this.pos,
					this.turn,
					this.ball,
					this.tagged
				);
			}
		} else {
			const catchableResult = catchable(
				this.pos,
				this.turn,
				this.select,
				this.ball,
				nextmove[0],
				nextmove[1]
			);
			// パスした場合の処理
			if (catchableResult != -1) {
				this.wait = tryCatch(
					this.ball,
					catchableResult,
					nextmove[0],
					nextmove[1],
					this.pos[this.turn][this.select][0],
					this.pos[this.turn][this.select][1],
					this.wait
				);
				this.ball = catchableResult;
				[this.select, this.turn, this.tagged] = stepPhase(
					this.select,
					this.pos,
					this.turn,
					this.ball,
					this.tagged
				);
			}
			// 移動する場合の処理
			else {
				this.pos[arrayTurn(this.turn)][this.select][0] = nextmove[0];
				this.pos[arrayTurn(this.turn)][this.select][1] = nextmove[1];
				[this.select, this.turn, this.tagged] = stepPhase(
					this.select,
					this.pos,
					this.turn,
					this.ball,
					this.tagged
				);
				// トライした場合の処理
				if (tryJudge(this.pos, this.ball)) {
					gameOverFunc(1, nextmove[0], nextmove[1]);
					return;
				}
			}
		}
		if (this.Role[arrayTurn(this.turn)] != "human") {
			if (appState) {
				appState.AIthinkFlag = 1;
				// window.DELAYDURATIONが設定されている場合はそれを使用、なければデフォルト値を使用
				const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
					? window.DELAYDURATION 
					: GameConfig.TimingConfig.DELAYDURATION;
				setTimeout(() => {
					this.AIturn(drawFunc, gameOverFunc, appState, Role);
				}, delayDuration);
			}
		}
		if (appState) {
			appState.AIthinkFlag = 0;
		}
		if (drawFunc) {
			drawFunc();
		}
	}
}

