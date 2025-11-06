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
		// アニメーション中の場合は処理を無効化（超高速の場合はスキップ）
		let rendererToUse = null;
		if (typeof window !== 'undefined' && window.renderer) {
			rendererToUse = window.renderer;
		} else if (appState?.renderer) {
			rendererToUse = appState.renderer;
		}
		
		// 評価値をクリア（1手動かす前に評価値を消す）
		if (rendererToUse && typeof rendererToUse.clearAnalysisValues === 'function') {
			rendererToUse.clearAnalysisValues();
		}
		
		// 超高速の場合はアニメーションロックをスキップ
		if (rendererToUse && rendererToUse.animationManager) {
			if (rendererToUse.animationManager.speedMultiplier === 0) {
				// 超高速の場合はロックチェックをスキップ
			} else if (rendererToUse.animationManager.hasActiveAnimations()) {
				return; // アニメーション中は処理をスキップ
			}
		}

		if (this.select == 0 && this.turn == 1) {
			this.step += 1;
		}
		// window.BOARDSIZEが設定されている場合はそれを使用、なければGameConfig.BoardConfig.BOARDSIZEを使用
		const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE !== undefined) ? window.BOARDSIZE : GameConfig.BoardConfig.BOARDSIZE;
		const movablelist = getMovableList(
			copyArray(this.pos),
			this.turn,
			this.select,
			this.tagged,
			boardsize
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
			const passElement = document.getElementById("pass");
			if (passElement) {
				passElement.innerHTML = "動けるところがないので1回休み";
			}
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
				// タグアニメーションを開始
				let rendererToUse = appState?.renderer;
				if (!rendererToUse && typeof window !== 'undefined' && window.renderer) {
					rendererToUse = window.renderer;
				}
				if (appState && rendererToUse && rendererToUse.animationManager) {
					const animationManager = rendererToUse.animationManager;
					// 超高速の場合はアニメーションをスキップ
					if (animationManager.speedMultiplier === 0) {
						// アニメーションなしで即座に処理
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
						// タグされた後、パス可能な相手がいるかチェック
						const passlistAfterTag = getPassList(
							copyArray(this.pos),
							this.turn,
							this.select,
							this.ball
						);
						// パス可能な相手がいない場合は1回休み
						if (passlistAfterTag.length == 0) {
							this.wait = this.ball;
							const passElement = document.getElementById("pass");
							if (passElement) {
								passElement.innerHTML = "パスする相手がいないので1回休み";
							}
						}
						if (drawFunc) {
							drawFunc();
						}
						// 次のターン処理
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
								}, delayDuration);
							}
						}
						return;
					}
					// タグ位置の座標を取得（タグされたプレイヤーの位置）
					const taggedPlayerX = this.pos[arrayTurn(this.turn)][this.select][0];
					const taggedPlayerY = this.pos[arrayTurn(this.turn)][this.select][1];
					animationManager.startTagAnimation(x, y, () => {
						if (drawFunc) {
							drawFunc();
						}
						// タグ取得のフィードバックエフェクトを表示（1秒停止 + 1秒フェードアウト）
						animationManager.startFeedbackEffect(taggedPlayerX, taggedPlayerY, "タグ！", "#FF6600", 2000);
						// アニメーション完了後の処理
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
						// タグされた後、パス可能な相手がいるかチェック
						const passlistAfterTag = getPassList(
							copyArray(this.pos),
							this.turn,
							this.select,
							this.ball
						);
						// パス可能な相手がいない場合は1回休み
						if (passlistAfterTag.length == 0) {
							this.wait = this.ball;
							const passElement = document.getElementById("pass");
							if (passElement) {
								passElement.innerHTML = "パスする相手がいないので1回休み";
							}
						}
						if (drawFunc) {
							drawFunc();
						}
						// 次のターン処理
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
								}, delayDuration);
							}
						}
					});
					// アニメーション開始直後に描画を開始
					if (drawFunc) {
						drawFunc(); // 即座に描画
					}
				} else {
					// アニメーションなしの場合
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
					// タグされた後、パス可能な相手がいるかチェック
					const passlistAfterTag = getPassList(
						copyArray(this.pos),
						this.turn,
						this.select,
						this.ball
					);
					// パス可能な相手がいない場合は1回休み
					if (passlistAfterTag.length == 0) {
						this.wait = this.ball;
						const passElement = document.getElementById("pass");
						if (passElement) {
							passElement.innerHTML = "パスする相手がいないので1回休み";
						}
						if (drawFunc) {
							drawFunc();
						}
						// 次のターン処理
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
								}, delayDuration);
							}
						}
					} else {
						if (drawFunc) {
							drawFunc();
						}
						// 次のターン処理
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
								}, delayDuration);
							}
						}
					}
				}
			}
		} else {
			const catchableResult = catchable(this.pos, this.turn, this.select, this.ball, x, y);
			// パスした場合の処理
			if (catchableResult != -1) {
				const fromX = this.pos[this.turn][this.select][0];
				const fromY = this.pos[this.turn][this.select][1];
				const toX = this.pos[arrayTurn(this.turn)][catchableResult][0];
				const toY = this.pos[arrayTurn(this.turn)][catchableResult][1];
				
				// パスアニメーションを開始
				let rendererToUse = appState?.renderer;
				if (!rendererToUse && typeof window !== 'undefined' && window.renderer) {
					rendererToUse = window.renderer;
				}
				if (appState && rendererToUse && rendererToUse.animationManager) {
					const animationManager = rendererToUse.animationManager;
					// 超高速の場合はアニメーションをスキップ
					if (animationManager.speedMultiplier === 0) {
						// アニメーションなしで即座に処理
						this.wait = tryCatch(
							this.ball,
							catchableResult,
							x,
							y,
							fromX,
							fromY,
							this.wait,
							animationManager
						);
						this.ball = catchableResult;
						[this.select, this.turn, this.tagged] = stepPhase(
							this.select,
							this.pos,
							this.turn,
							this.ball,
							this.tagged
						);
						if (drawFunc) {
							drawFunc();
						}
						// 次のターン処理
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
								}, delayDuration);
							}
						}
						return;
					}
					animationManager.startPassAnimation(fromX, fromY, toX, toY, () => {
						// アニメーション完了後の処理
						this.wait = tryCatch(
							this.ball,
							catchableResult,
							x,
							y,
							fromX,
							fromY,
							this.wait,
							animationManager
						);
						this.ball = catchableResult;
						[this.select, this.turn, this.tagged] = stepPhase(
							this.select,
							this.pos,
							this.turn,
							this.ball,
							this.tagged
						);
						if (drawFunc) {
							drawFunc();
						}
						// 次のターン処理
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
								}, delayDuration);
							}
						}
					});
					// アニメーション開始直後に描画を開始
					if (drawFunc) {
						drawFunc(); // 即座に描画
					}
				} else {
					// アニメーションなしの場合
					let animationManager = null;
					if (appState && rendererToUse && rendererToUse.animationManager) {
						animationManager = rendererToUse.animationManager;
					}
					this.wait = tryCatch(
						this.ball,
						catchableResult,
						x,
						y,
						fromX,
						fromY,
						this.wait,
						animationManager
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
			}
			// 移動する場合の処理
			else {
				for (let i = 0; i < movablelist.length; i++) {
					if (x == movablelist[i][0] && y == movablelist[i][1]) {
						const fromX = this.pos[arrayTurn(this.turn)][this.select][0];
						const fromY = this.pos[arrayTurn(this.turn)][this.select][1];
						const toX = x;
						const toY = y;
						
						// 移動アニメーションを開始
						// rendererを取得（優先順位: window.renderer > appState.renderer）
						let rendererToUse = null;
						if (typeof window !== 'undefined' && window.renderer) {
							rendererToUse = window.renderer;
						} else if (appState?.renderer) {
							rendererToUse = appState.renderer;
						}
						
						if (appState && rendererToUse && rendererToUse.animationManager) {
							const animationManager = rendererToUse.animationManager;
							// 超高速の場合はアニメーションをスキップ
							if (animationManager.speedMultiplier === 0) {
								// アニメーションなしで即座に処理
								this.pos[arrayTurn(this.turn)][this.select][0] = toX;
								this.pos[arrayTurn(this.turn)][this.select][1] = toY;
								[this.select, this.turn, this.tagged] = stepPhase(
									this.select,
									this.pos,
									this.turn,
									this.ball,
									this.tagged
								);
								if (drawFunc) {
									drawFunc();
								}
								// トライした場合の処理
								if (tryJudge(this.pos, this.ball)) {
									gameOverFunc(1, toX, toY);
									return;
								}
								// 次のターン処理
								if (this.Role[arrayTurn(this.turn)] != "human") {
									if (appState) {
										appState.AIthinkFlag = 1;
										const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
											? window.DELAYDURATION 
											: GameConfig.TimingConfig.DELAYDURATION;
										setTimeout(() => {
											this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
										}, delayDuration);
									}
								}
								return;
							}
							animationManager.startMoveAnimation(
								arrayTurn(this.turn),
								this.select,
								fromX,
								fromY,
								toX,
								toY,
								() => {
									if (drawFunc) {
										drawFunc();
									}
									// アニメーション完了後の処理
									this.pos[arrayTurn(this.turn)][this.select][0] = toX;
									this.pos[arrayTurn(this.turn)][this.select][1] = toY;
									[this.select, this.turn, this.tagged] = stepPhase(
										this.select,
										this.pos,
										this.turn,
										this.ball,
										this.tagged
									);
									if (drawFunc) {
										drawFunc();
									}
									// トライした場合の処理
									if (tryJudge(this.pos, this.ball)) {
										gameOverFunc(1, toX, toY);
										return;
									}
									// 次のターン処理
									if (this.Role[arrayTurn(this.turn)] != "human") {
										if (appState) {
											appState.AIthinkFlag = 1;
											const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
												? window.DELAYDURATION 
												: GameConfig.TimingConfig.DELAYDURATION;
											setTimeout(() => {
												this.AIturn(drawFunc, gameOverFunc, appState, appState.Role);
											}, delayDuration);
										}
									}
								}
							);
							// アニメーション開始直後に描画を開始（位置を更新する前に）
							// 位置はアニメーション完了まで更新しない
							if (drawFunc) {
								drawFunc(); // 即座に描画
							}
						} else {
							// アニメーションなしの場合
							this.pos[arrayTurn(this.turn)][this.select][0] = x;
							this.pos[arrayTurn(this.turn)][this.select][1] = y;
							[this.select, this.turn, this.tagged] = stepPhase(
								this.select,
								this.pos,
								this.turn,
								this.ball,
								this.tagged
							);
							// トライした場合の処理
							if (tryJudge(this.pos, this.ball)) {
								gameOverFunc(1, x, y);
								return;
							}
						}
					}
				}
			}
		}
		// アニメーションが開始されていない場合のみ、ここで次のターン処理と描画を行う
		// アニメーションが開始された場合は、コールバック内で処理される
		// rendererを取得（既に宣言済みの変数を再利用）
		if (!rendererToUse) {
			rendererToUse = appState?.renderer;
			if (!rendererToUse && typeof window !== 'undefined' && window.renderer) {
				rendererToUse = window.renderer;
			}
		}
		const hasAnimation = appState && rendererToUse && rendererToUse.animationManager && 
			rendererToUse.animationManager.hasActiveAnimations();
		if (!hasAnimation) {
			if (this.Role[arrayTurn(this.turn)] != "human") {
				if (appState) {
					appState.AIthinkFlag = 1;
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
		} else {
			// アニメーション中は描画を開始
			if (drawFunc) {
				drawFunc();
			}
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
		
		// 評価値をクリア（1手動かす前に評価値を消す）
		let rendererToUse = null;
		if (typeof window !== 'undefined' && window.renderer) {
			rendererToUse = window.renderer;
		} else if (appState?.renderer) {
			rendererToUse = appState.renderer;
		}
		if (rendererToUse && typeof rendererToUse.clearAnalysisValues === 'function') {
			rendererToUse.clearAnalysisValues();
		}

		// AIの思考
		if (this.select == 0 && this.turn == 1) {
			this.step += 1;
		}
		const AI_name = Role ? Role[arrayTurn(this.turn)] : this.Role[arrayTurn(this.turn)];
		let nextmove = [];
		let eval_list = [];

		// window.BOARDSIZEが設定されている場合はそれを使用、なければGameConfig.BoardConfig.BOARDSIZEを使用
		const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : GameConfig.BoardConfig.BOARDSIZE;
		const movablelist = getMovableList(
			copyArray(this.pos),
			this.turn,
			this.select,
			this.tagged,
			boardsize
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
				// タグアニメーションを開始
				// rendererを取得（既に宣言されている変数を使用）
				if (!rendererToUse) {
					if (appState?.renderer) {
						rendererToUse = appState.renderer;
					} else if (typeof window !== 'undefined' && window.renderer) {
						rendererToUse = window.renderer;
					}
				}
				if (appState && rendererToUse && rendererToUse.animationManager) {
					const animationManager = rendererToUse.animationManager;
					// 超高速の場合はアニメーションをスキップ
					if (animationManager.speedMultiplier === 0) {
						// アニメーションなしで即座に処理
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
						// タグされた後、パス可能な相手がいるかチェック
						const passlistAfterTag = getPassList(
							copyArray(this.pos),
							this.turn,
							this.select,
							this.ball
						);
						// パス可能な相手がいない場合は1回休み
						if (passlistAfterTag.length == 0) {
							this.wait = this.ball;
							const passElement = document.getElementById("pass");
							if (passElement) {
								passElement.innerHTML = "パスする相手がいないので1回休み";
							}
						}
						if (drawFunc) {
							drawFunc();
						}
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, Role);
								}, delayDuration);
							}
						}
						return;
					}
					// タグ位置の座標を取得（タグされたプレイヤーの位置）
					const taggedPlayerX = this.pos[arrayTurn(this.turn)][this.select][0];
					const taggedPlayerY = this.pos[arrayTurn(this.turn)][this.select][1];
					animationManager.startTagAnimation(nextmove[0], nextmove[1], () => {
						if (drawFunc) {
							drawFunc();
						}
						// タグ取得のフィードバックエフェクトを表示（1秒停止 + 1秒フェードアウト）
						animationManager.startFeedbackEffect(taggedPlayerX, taggedPlayerY, "タグ！", "#FF6600", 2000);
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
						// タグされた後、パス可能な相手がいるかチェック
						const passlistAfterTag = getPassList(
							copyArray(this.pos),
							this.turn,
							this.select,
							this.ball
						);
						// パス可能な相手がいない場合は1回休み
						if (passlistAfterTag.length == 0) {
							this.wait = this.ball;
							const passElement = document.getElementById("pass");
							if (passElement) {
								passElement.innerHTML = "パスする相手がいないので1回休み";
							}
						}
						if (drawFunc) {
							drawFunc();
						}
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, Role);
								}, delayDuration);
							}
						}
					});
					// アニメーション開始直後に描画を開始
					if (drawFunc) {
						drawFunc(); // 即座に描画
					}
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
					// タグされた後、パス可能な相手がいるかチェック
					const passlistAfterTag = getPassList(
						copyArray(this.pos),
						this.turn,
						this.select,
						this.ball
					);
					// パス可能な相手がいない場合は1回休み
					if (passlistAfterTag.length == 0) {
						this.wait = this.ball;
						const passElement = document.getElementById("pass");
						if (passElement) {
							passElement.innerHTML = "パスする相手がいないので1回休み";
						}
					}
					if (drawFunc) {
						drawFunc();
					}
					// 次のターン処理
					if (this.Role[arrayTurn(this.turn)] != "human") {
						if (appState) {
							appState.AIthinkFlag = 1;
							const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
								? window.DELAYDURATION 
								: GameConfig.TimingConfig.DELAYDURATION;
							setTimeout(() => {
								this.AIturn(drawFunc, gameOverFunc, appState, Role);
							}, delayDuration);
						}
					}
				}
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
				const fromX = this.pos[this.turn][this.select][0];
				const fromY = this.pos[this.turn][this.select][1];
				const toX = this.pos[arrayTurn(this.turn)][catchableResult][0];
				const toY = this.pos[arrayTurn(this.turn)][catchableResult][1];
				
				// パスアニメーションを開始
				// rendererを取得（既に宣言されている変数を使用）
				if (!rendererToUse) {
					if (appState?.renderer) {
						rendererToUse = appState.renderer;
					} else if (typeof window !== 'undefined' && window.renderer) {
						rendererToUse = window.renderer;
					}
				}
				if (appState && rendererToUse && rendererToUse.animationManager) {
					const animationManager = rendererToUse.animationManager;
					// 超高速の場合はアニメーションをスキップ
					if (animationManager.speedMultiplier === 0) {
						// アニメーションなしで即座に処理
						this.wait = tryCatch(
							this.ball,
							catchableResult,
							nextmove[0],
							nextmove[1],
							fromX,
							fromY,
							this.wait,
							animationManager
						);
						this.ball = catchableResult;
						[this.select, this.turn, this.tagged] = stepPhase(
							this.select,
							this.pos,
							this.turn,
							this.ball,
							this.tagged
						);
						if (drawFunc) {
							drawFunc();
						}
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, Role);
								}, delayDuration);
							}
						}
						return;
					}
					animationManager.startPassAnimation(fromX, fromY, toX, toY, () => {
						this.wait = tryCatch(
							this.ball,
							catchableResult,
							nextmove[0],
							nextmove[1],
							fromX,
							fromY,
							this.wait,
							animationManager
						);
						this.ball = catchableResult;
						[this.select, this.turn, this.tagged] = stepPhase(
							this.select,
							this.pos,
							this.turn,
							this.ball,
							this.tagged
						);
						if (drawFunc) {
							drawFunc();
						}
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, Role);
								}, delayDuration);
							}
						}
					});
					// アニメーション開始直後に描画を開始
					if (drawFunc) {
						drawFunc(); // 即座に描画
					}
				} else {
					let animationManager = null;
					if (appState && rendererToUse && rendererToUse.animationManager) {
						animationManager = rendererToUse.animationManager;
					}
					this.wait = tryCatch(
						this.ball,
						catchableResult,
						nextmove[0],
						nextmove[1],
						fromX,
						fromY,
						this.wait,
						animationManager
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
			}
			// 移動する場合の処理
			else {
				const fromX = this.pos[arrayTurn(this.turn)][this.select][0];
				const fromY = this.pos[arrayTurn(this.turn)][this.select][1];
				const toX = nextmove[0];
				const toY = nextmove[1];
				
				// 移動アニメーションを開始
				if (appState && appState.renderer && appState.renderer.animationManager) {
					const animationManager = appState.renderer.animationManager;
					// 超高速の場合はアニメーションをスキップ
					if (animationManager.speedMultiplier === 0) {
						// アニメーションなしで即座に処理
						this.pos[arrayTurn(this.turn)][this.select][0] = toX;
						this.pos[arrayTurn(this.turn)][this.select][1] = toY;
						[this.select, this.turn, this.tagged] = stepPhase(
							this.select,
							this.pos,
							this.turn,
							this.ball,
							this.tagged
						);
						if (drawFunc) {
							drawFunc();
						}
						// トライした場合の処理
						if (tryJudge(this.pos, this.ball)) {
							gameOverFunc(1, toX, toY);
							return;
						}
						if (this.Role[arrayTurn(this.turn)] != "human") {
							if (appState) {
								appState.AIthinkFlag = 1;
								const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
									? window.DELAYDURATION 
									: GameConfig.TimingConfig.DELAYDURATION;
								setTimeout(() => {
									this.AIturn(drawFunc, gameOverFunc, appState, Role);
								}, delayDuration);
							}
						}
						return;
					}
					animationManager.startMoveAnimation(
						arrayTurn(this.turn),
						this.select,
						fromX,
						fromY,
						toX,
						toY,
						() => {
							if (drawFunc) {
								drawFunc();
							}
							this.pos[arrayTurn(this.turn)][this.select][0] = toX;
							this.pos[arrayTurn(this.turn)][this.select][1] = toY;
							[this.select, this.turn, this.tagged] = stepPhase(
								this.select,
								this.pos,
								this.turn,
								this.ball,
								this.tagged
							);
							if (drawFunc) {
								drawFunc();
							}
							// トライした場合の処理
							if (tryJudge(this.pos, this.ball)) {
								gameOverFunc(1, toX, toY);
								return;
							}
							if (this.Role[arrayTurn(this.turn)] != "human") {
								if (appState) {
									appState.AIthinkFlag = 1;
									const delayDuration = (typeof window !== 'undefined' && typeof window.DELAYDURATION !== 'undefined') 
										? window.DELAYDURATION 
										: GameConfig.TimingConfig.DELAYDURATION;
									setTimeout(() => {
										this.AIturn(drawFunc, gameOverFunc, appState, Role);
									}, delayDuration);
								}
							}
						}
					);
					// アニメーション開始直後に描画を開始
					if (drawFunc) {
						drawFunc();
					}
				} else {
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
		}
		// アニメーションが開始されていない場合のみ、ここで次のターン処理と描画を行う
		// rendererを取得（既に宣言されている変数を使用）
		rendererToUse = null;
		if (appState?.renderer) {
			rendererToUse = appState.renderer;
		} else if (typeof window !== 'undefined' && window.renderer) {
			rendererToUse = window.renderer;
		}
		const hasAnimation = appState && rendererToUse && rendererToUse.animationManager && 
			rendererToUse.animationManager.hasActiveAnimations();
		if (!hasAnimation) {
			if (this.Role[arrayTurn(this.turn)] != "human") {
				if (appState) {
					appState.AIthinkFlag = 1;
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
		} else {
			// アニメーション中は描画を開始
			if (appState) {
				appState.AIthinkFlag = 0;
			}
			if (drawFunc) {
				drawFunc();
			}
		}
	}
}

