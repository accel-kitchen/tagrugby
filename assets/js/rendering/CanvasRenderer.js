/* --------------------------------------------------------------------------
 * Canvas Renderer
 * キャンバスの描画を管理
 * -------------------------------------------------------------------------- */

import { GameConfig } from '../config/GameConfig.js';
import { arrayTurn } from '../utils/gameUtils.js';
import { getMovableList } from '../game/ActionValidator.js';
import { getPassList } from '../game/ActionValidator.js';
import { copyArray } from '../utils/array.js';
import { AnimationManager } from './AnimationManager.js';

/**
 * キャンバスレンダラークラス
 */
export class CanvasRenderer {
	constructor(canvas, ctx, gameState, appState, animationManager = null) {
		this.canvas = canvas;
		this.ctx = ctx;
		this.gameState = gameState;
		this.appState = appState;
		this.BLOCKSIZE = GameConfig.BoardConfig.BLOCKSIZE;
		this.BOARDSIZE = GameConfig.BoardConfig.BOARDSIZE;
		this.NUMSIZE = GameConfig.BoardConfig.NUMSIZE;
		this.CANVASSIZE = GameConfig.BoardConfig.CANVASSIZE;
		this.animationManager = animationManager || new AnimationManager();
		this.drawRequestId = null;
	}

	/**
	 * サイズを更新（キャンバスリサイズ時など）
	 */
	updateSize(blocksize, boardsize, numsize, canvassize) {
		this.BLOCKSIZE = blocksize;
		this.BOARDSIZE = boardsize;
		this.NUMSIZE = numsize;
		this.CANVASSIZE = canvassize;
	}

	/**
	 * 最終位置のディスクを描画
	 * @param {number} x - x座標
	 * @param {number} y - y座標
	 */
	drawFinalDisc(x, y) {
		this.ctx.beginPath();
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = "#FFFFFF";
		this.ctx.beginPath();
		this.ctx.arc(
			x * this.BLOCKSIZE + ~~(this.BLOCKSIZE * 0.5) + this.NUMSIZE + 0.5,
			y * this.BLOCKSIZE + ~~(this.BLOCKSIZE * 0.5) + this.NUMSIZE + 0.5,
			(this.BLOCKSIZE / 2) * 0.8,
			0,
			2 * Math.PI,
			false
		);
		this.ctx.fill();
		this.ctx.stroke();
	}

	/**
	 * ゲーム盤面を描画
	 * @param {Function} refreshParamFunc - パラメータ更新関数
	 */
	draw(refreshParamFunc) {
		if (refreshParamFunc) {
			refreshParamFunc();
		}

		// 描画の削除
		this.ctx.clearRect(0, 0, this.CANVASSIZE + this.NUMSIZE, this.CANVASSIZE + this.NUMSIZE);

		// ボード背景の描画
		this.ctx.beginPath();
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = GameConfig.Colors.BOARDCOLOR;
		this.ctx.fillRect(
			this.NUMSIZE + 0.5,
			this.NUMSIZE + this.BLOCKSIZE + 0.5,
			this.BLOCKSIZE * this.BOARDSIZE,
			this.BLOCKSIZE * (this.BOARDSIZE - 1)
		);
		this.ctx.fill();

		// ゴールエリアの表示 - ビビッドなグラデーション
		const goalGradient = this.ctx.createLinearGradient(
			this.NUMSIZE + 0.5,
			this.NUMSIZE + 0.5,
			this.NUMSIZE + 0.5,
			this.NUMSIZE + this.BLOCKSIZE + 0.5
		);
		goalGradient.addColorStop(0, "#FF6B35");
		goalGradient.addColorStop(0.5, "#FF8C42");
		goalGradient.addColorStop(1, "#FF6B35");
		this.ctx.beginPath();
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = goalGradient;
		this.ctx.fillRect(
			this.NUMSIZE + 0.5,
			this.NUMSIZE + 0.5,
			this.BLOCKSIZE * this.BOARDSIZE,
			this.BLOCKSIZE
		);
		this.ctx.fill();

		// 罫線の描画 - より鮮明な線
		this.ctx.beginPath();
		this.ctx.globalAlpha = 1;
		this.ctx.strokeStyle = GameConfig.Colors.BOARDERCOLOR;
		this.ctx.lineWidth = 1.5;
		for (let i = 0; i <= this.BOARDSIZE; i++) {
			this.ctx.moveTo(~~(i * this.BLOCKSIZE) + this.NUMSIZE + 0.5, 0.5);
			this.ctx.lineTo(
				~~(i * this.BLOCKSIZE) + this.NUMSIZE + 0.5,
				this.CANVASSIZE + this.NUMSIZE + 0.5
			);

			this.ctx.moveTo(0.5, ~~(i * this.BLOCKSIZE) + this.NUMSIZE + 0.5);
			this.ctx.lineTo(
				this.CANVASSIZE + this.NUMSIZE + 0.5,
				~~(i * this.BLOCKSIZE) + this.NUMSIZE + 0.5
			);
		}
		this.ctx.stroke();
		this.ctx.lineWidth = 1;

		// 選択コマの表示 - ビビッドなハイライト
		const selectGradient = this.ctx.createRadialGradient(
			this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][0] *
				this.BLOCKSIZE +
				this.NUMSIZE +
				this.BLOCKSIZE / 2,
			this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][1] *
				this.BLOCKSIZE +
				this.NUMSIZE +
				this.BLOCKSIZE / 2,
			0,
			this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][0] *
				this.BLOCKSIZE +
				this.NUMSIZE +
				this.BLOCKSIZE / 2,
			this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][1] *
				this.BLOCKSIZE +
				this.NUMSIZE +
				this.BLOCKSIZE / 2,
			this.BLOCKSIZE / 2
		);
		selectGradient.addColorStop(0, "rgba(255, 107, 53, 0.5)");
		selectGradient.addColorStop(1, "rgba(255, 107, 53, 0.2)");
		this.ctx.lineWidth = 0;
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = selectGradient;
		this.ctx.fillRect(
			this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][0] *
				this.BLOCKSIZE +
				this.NUMSIZE +
				0.5,
			this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][1] *
				this.BLOCKSIZE +
				this.NUMSIZE +
				0.5,
			this.BLOCKSIZE,
			this.BLOCKSIZE
		);
		this.ctx.fill();

		// コマの表示 - ビビッドなグラデーション効果
		this.ctx.globalAlpha = 1;
		for (let i = 0; i <= 1; i++) {
			for (let j = 0; j < this.gameState.pos[i].length; j++) {
				// アニメーション中の位置を取得
				const animPos = this.animationManager.getMovePosition(i, j);
				let posX, posY;
				if (animPos) {
					posX = animPos.x;
					posY = animPos.y;
				} else {
					posX = this.gameState.pos[i][j][0];
					posY = this.gameState.pos[i][j][1];
				}

				const centerX = posX * this.BLOCKSIZE +
					~~(this.BLOCKSIZE * 0.5) +
					this.NUMSIZE +
					0.5;
				const centerY = posY * this.BLOCKSIZE +
					~~(this.BLOCKSIZE * 0.5) +
					this.NUMSIZE +
					0.5;
				const radius = (this.BLOCKSIZE / 2) * 0.8;
				
				// グラデーションを作成
				const discGradient = this.ctx.createRadialGradient(
					centerX - radius * 0.3,
					centerY - radius * 0.3,
					0,
					centerX,
					centerY,
					radius
				);
				
				if (i == 0) {
					discGradient.addColorStop(0, "#FF4757");
					discGradient.addColorStop(1, GameConfig.Colors.DEFENSEFILLCOLOR);
					this.ctx.fillStyle = discGradient;
					this.ctx.strokeStyle = GameConfig.Colors.DEFENSEBORDERCOLOR;
				}
				if (i == 1) {
					discGradient.addColorStop(0, "#74B9FF");
					discGradient.addColorStop(1, GameConfig.Colors.ATTACKFILLCOLOR);
					this.ctx.fillStyle = discGradient;
					this.ctx.strokeStyle = GameConfig.Colors.ATTACKBORDERCOLOR;
				}
				
				this.ctx.beginPath();
				this.ctx.lineWidth = 2;
				this.ctx.arc(
					centerX,
					centerY,
					radius,
					0,
					2 * Math.PI,
					false
				);
				this.ctx.fill();
				this.ctx.stroke();
			}
		}
		this.ctx.lineWidth = 1;

		// ボールの表示
		// パスアニメーション中かチェック
		const passPos = this.animationManager.getPassPosition();
		let ballX, ballY;
		if (passPos) {
			// パスアニメーション中
			ballX = passPos.x;
			ballY = passPos.y;
		} else {
			// 通常位置
			ballX = this.gameState.pos[1][this.gameState.ball][0];
			ballY = this.gameState.pos[1][this.gameState.ball][1];
		}

		if (this.ballImage) {
			// 画像が既に読み込まれている場合は描画
			const drawX = ballX * this.BLOCKSIZE +
				~~(this.BLOCKSIZE * 0.5) +
				this.NUMSIZE +
				0.5 -
				this.BLOCKSIZE * 0.3;
			const drawY = ballY * this.BLOCKSIZE +
				~~(this.BLOCKSIZE * 0.5) +
				this.NUMSIZE +
				0.5 -
				this.BLOCKSIZE * 0.3;
			
			// パスアニメーション中は高さを考慮（z座標）
			if (passPos && passPos.z > 0) {
				this.ctx.save();
				this.ctx.translate(drawX + this.BLOCKSIZE * 0.3, drawY + this.BLOCKSIZE * 0.3);
				this.ctx.scale(1, 1 - passPos.z * 0.1); // 高さに応じて縮小
				this.ctx.drawImage(
					this.ballImage,
					-this.BLOCKSIZE * 0.3,
					-this.BLOCKSIZE * 0.3 - passPos.z * this.BLOCKSIZE * 0.2,
					this.BLOCKSIZE * 0.6,
					this.BLOCKSIZE * 0.6
				);
				this.ctx.restore();
			} else {
				this.ctx.drawImage(
					this.ballImage,
					drawX,
					drawY,
					this.BLOCKSIZE * 0.6,
					this.BLOCKSIZE * 0.6
				);
			}
		} else {
			// 画像が読み込まれていない場合は読み込み
			const ball = new Image();
			ball.src = "./assets/img/ball.svg";
			const self = this;
			ball.onload = () => {
				self.ballImage = ball;
				// 読み込み後に再描画
				if (self.gameState && self.ctx) {
					const drawX = ballX * self.BLOCKSIZE +
						~~(self.BLOCKSIZE * 0.5) +
						self.NUMSIZE +
						0.5 -
						self.BLOCKSIZE * 0.3;
					const drawY = ballY * self.BLOCKSIZE +
						~~(self.BLOCKSIZE * 0.5) +
						self.NUMSIZE +
						0.5 -
						self.BLOCKSIZE * 0.3;
					self.ctx.drawImage(
						ball,
						drawX,
						drawY,
						self.BLOCKSIZE * 0.6,
						self.BLOCKSIZE * 0.6
					);
				}
			};
		}

		// タグエフェクトの表示
		const tagPos = this.animationManager.getTagPosition();
		const tagScale = this.animationManager.getTagScale();
		if (tagPos && tagScale) {
			this.ctx.save();
			const centerX = tagPos.x * this.BLOCKSIZE +
				~~(this.BLOCKSIZE * 0.5) +
				this.NUMSIZE +
				0.5;
			const centerY = tagPos.y * this.BLOCKSIZE +
				~~(this.BLOCKSIZE * 0.5) +
				this.NUMSIZE +
				0.5;
			const radius = (this.BLOCKSIZE / 2) * 0.8 * tagScale;
			
			// パルスエフェクト
			const pulseGradient = this.ctx.createRadialGradient(
				centerX,
				centerY,
				0,
				centerX,
				centerY,
				radius
			);
			pulseGradient.addColorStop(0, "rgba(255, 107, 53, 0.8)");
			pulseGradient.addColorStop(0.5, "rgba(255, 107, 53, 0.4)");
			pulseGradient.addColorStop(1, "rgba(255, 107, 53, 0)");
			
			this.ctx.globalAlpha = 1 - Math.abs(tagScale - 1.25) * 2;
			this.ctx.fillStyle = pulseGradient;
			this.ctx.beginPath();
			this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
			this.ctx.fill();
			this.ctx.restore();
		}

		// ボード脇の色を設定
		this.ctx.beginPath();
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = GameConfig.Colors.BACKGROUNDCOLOR;
		this.ctx.rect(0, 0, this.CANVASSIZE + this.NUMSIZE, this.NUMSIZE);
		this.ctx.rect(0, 0, this.NUMSIZE, this.CANVASSIZE + this.NUMSIZE);
		this.ctx.fill();

		// 座標ラベルの表示
		for (let i = 0; i < this.BOARDSIZE; i++) {
			this.ctx.beginPath();
			this.ctx.font = this.NUMSIZE * 0.8 + "px Osaka";
			this.ctx.textBaseline = "middle";
			this.ctx.textAlign = "center";
			this.ctx.fillStyle = GameConfig.Colors.FONTCOLOR;
			this.ctx.fillText(
				GameConfig.boardWordVer[i],
				(i + 0.5) * this.BLOCKSIZE + this.NUMSIZE + 0.5,
				this.NUMSIZE * 0.5
			);
			this.ctx.fillText(
				GameConfig.boardWordHor[i],
				this.NUMSIZE * 0.5,
				(i + 0.5) * this.BLOCKSIZE + this.NUMSIZE + 0.5
			);
		}

		// 可動範囲の表示
		if (this.gameState.select != this.gameState.wait) {
			this.ctx.globalAlpha = 0.2;
			const movablelist = getMovableList(
				this.gameState.pos,
				this.gameState.turn,
				this.gameState.select,
				this.gameState.tagged,
				this.BOARDSIZE
			);
			if (this.gameState.turn == -1) {
				this.ctx.fillStyle = GameConfig.Colors.DEFENSEFILLCOLOR;
				this.ctx.strokeStyle = GameConfig.Colors.DEFENSEBORDERCOLOR;
				this.ctx.lineWidth = 1.5;
			}
			if (this.gameState.turn == 1) {
				this.ctx.fillStyle = GameConfig.Colors.ATTACKFILLCOLOR;
				this.ctx.strokeStyle = GameConfig.Colors.ATTACKBORDERCOLOR;
				this.ctx.lineWidth = 1.5;
			}
			for (let i = 0; i < movablelist.length; i++) {
				this.ctx.beginPath();
				this.ctx.arc(
					movablelist[i][0] * this.BLOCKSIZE +
						~~(this.BLOCKSIZE * 0.5) +
						this.NUMSIZE +
						0.5,
					movablelist[i][1] * this.BLOCKSIZE +
						~~(this.BLOCKSIZE * 0.5) +
						this.NUMSIZE +
						0.5,
					(this.BLOCKSIZE / 2) * 0.8,
					0,
					2 * Math.PI,
					false
				);
				this.ctx.fill();
				this.ctx.stroke();
			}
			this.ctx.lineWidth = 1;
			if (this.gameState.select == this.gameState.ball) {
				const passlist = getPassList(
					copyArray(this.gameState.pos),
					this.gameState.turn,
					this.gameState.select,
					this.gameState.ball
				);
				this.ctx.fillStyle = GameConfig.Colors.BALLCOLOR;
				this.ctx.globalAlpha = 0.7;
				for (let i = 0; i < passlist.length; i++) {
					this.ctx.beginPath();
					this.ctx.arc(
						passlist[i][0] * this.BLOCKSIZE +
							~~(this.BLOCKSIZE * 0.5) +
							this.NUMSIZE +
							0.5,
						passlist[i][1] * this.BLOCKSIZE +
							~~(this.BLOCKSIZE * 0.5) +
							this.NUMSIZE +
							0.5,
						(this.BLOCKSIZE / 2) * 0.3,
						0,
						2 * Math.PI,
						false
					);
					this.ctx.fill();
					this.ctx.stroke();
				}
			}
		}
		this.ctx.fillStyle = GameConfig.Colors.FONTCOLOR;
		this.ctx.globalAlpha = 0.5;

		// フィードバックエフェクトの描画
		const feedbackEffects = this.animationManager.getFeedbackEffects();
		if (feedbackEffects.length > 0) {
			this.ctx.save();
			this.ctx.font = 'bold 16px sans-serif';
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'middle';
			
			for (const effect of feedbackEffects) {
				const screenX = effect.x * this.BLOCKSIZE +
					~~(this.BLOCKSIZE * 0.5) +
					this.NUMSIZE +
					0.5;
				// 選手の上のマスに表示するため、Y座標から1マス分（BLOCKSIZE）引く
				const screenY = (effect.y - 1) * this.BLOCKSIZE +
					~~(this.BLOCKSIZE * 0.5) +
					this.NUMSIZE +
					0.5;
				
				// テキストの影を描画（視認性向上）
				this.ctx.globalAlpha = effect.opacity * 0.5;
				this.ctx.fillStyle = '#000000';
				this.ctx.fillText(effect.text, screenX + 1, screenY + 1);
				
				// メインテキストを描画
				this.ctx.globalAlpha = effect.opacity;
				this.ctx.fillStyle = effect.color;
				this.ctx.fillText(effect.text, screenX, screenY);
			}
			
			this.ctx.restore();
		}

		// アニメーション中は次のフレームで再描画をスケジュール（描画の最後に）
		if (this.animationManager.hasActiveAnimations()) {
			// 現在のリクエストをキャンセル
			if (this.drawRequestId !== null) {
				cancelAnimationFrame(this.drawRequestId);
			}
			this.drawRequestId = requestAnimationFrame(() => {
				this.drawRequestId = null;
				this.draw(refreshParamFunc);
			});
		} else {
			// アニメーションがない場合はリクエストをクリア
			if (this.drawRequestId !== null) {
				cancelAnimationFrame(this.drawRequestId);
				this.drawRequestId = null;
			}
		}
	}
}

