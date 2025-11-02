/* --------------------------------------------------------------------------
 * Canvas Renderer
 * キャンバスの描画を管理
 * -------------------------------------------------------------------------- */

import { GameConfig } from '../config/GameConfig.js';
import { arrayTurn } from '../utils/gameUtils.js';
import { getMovableList } from '../game/ActionValidator.js';
import { getPassList } from '../game/ActionValidator.js';
import { copyArray } from '../utils/array.js';

/**
 * キャンバスレンダラークラス
 */
export class CanvasRenderer {
	constructor(canvas, ctx, gameState, appState) {
		this.canvas = canvas;
		this.ctx = ctx;
		this.gameState = gameState;
		this.appState = appState;
		this.BLOCKSIZE = GameConfig.BoardConfig.BLOCKSIZE;
		this.BOARDSIZE = GameConfig.BoardConfig.BOARDSIZE;
		this.NUMSIZE = GameConfig.BoardConfig.NUMSIZE;
		this.CANVASSIZE = GameConfig.BoardConfig.CANVASSIZE;
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

		// ゴールエリアの表示
		this.ctx.beginPath();
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = GameConfig.Colors.INGOALCOLOR;
		this.ctx.fillRect(
			this.NUMSIZE + 0.5,
			this.NUMSIZE + 0.5,
			this.BLOCKSIZE * this.BOARDSIZE,
			this.BLOCKSIZE
		);
		this.ctx.fill();

		// 罫線の描画
		this.ctx.beginPath();
		this.ctx.globalAlpha = 1;
		this.ctx.strokeStyle = GameConfig.Colors.BOARDERCOLOR;
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

		// 選択コマの表示
		this.ctx.lineWidth = 0;
		this.ctx.globalAlpha = 0.3;
		this.ctx.fillStyle = GameConfig.Colors.SELECTDISC;
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

		// コマの表示
		this.ctx.globalAlpha = 1;
		for (let i = 0; i <= 1; i++) {
			if (i == 0) {
				this.ctx.fillStyle = GameConfig.Colors.DEFENSEFILLCOLOR;
				this.ctx.strokeStyle = GameConfig.Colors.DEFENSEBORDERCOLOR;
			}
			if (i == 1) {
				this.ctx.fillStyle = GameConfig.Colors.ATTACKFILLCOLOR;
				this.ctx.strokeStyle = GameConfig.Colors.ATTACKBORDERCOLOR;
			}
			for (let j = 0; j < this.gameState.pos[i].length; j++) {
				this.ctx.beginPath();
				this.ctx.arc(
					this.gameState.pos[i][j][0] * this.BLOCKSIZE +
						~~(this.BLOCKSIZE * 0.5) +
						this.NUMSIZE +
						0.5,
					this.gameState.pos[i][j][1] * this.BLOCKSIZE +
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
		}

		// ボールの表示
		if (this.ballImage) {
			// 画像が既に読み込まれている場合は描画
			this.ctx.drawImage(
				this.ballImage,
				this.gameState.pos[1][this.gameState.ball][0] * this.BLOCKSIZE +
					~~(this.BLOCKSIZE * 0.5) +
					this.NUMSIZE +
					0.5 -
					this.BLOCKSIZE * 0.3,
				this.gameState.pos[1][this.gameState.ball][1] * this.BLOCKSIZE +
					~~(this.BLOCKSIZE * 0.5) +
					this.NUMSIZE +
					0.5 -
					this.BLOCKSIZE * 0.3,
				this.BLOCKSIZE * 0.6,
				this.BLOCKSIZE * 0.6
			);
		} else {
			// 画像が読み込まれていない場合は読み込み
			const ball = new Image();
			ball.src = "./assets/img/ball.svg";
			const self = this;
			ball.onload = () => {
				self.ballImage = ball;
				// 読み込み後に再描画
				if (self.gameState && self.ctx) {
					self.ctx.drawImage(
						ball,
						self.gameState.pos[1][self.gameState.ball][0] * self.BLOCKSIZE +
							~~(self.BLOCKSIZE * 0.5) +
							self.NUMSIZE +
							0.5 -
							self.BLOCKSIZE * 0.3,
						self.gameState.pos[1][self.gameState.ball][1] * self.BLOCKSIZE +
							~~(self.BLOCKSIZE * 0.5) +
							self.NUMSIZE +
							0.5 -
							self.BLOCKSIZE * 0.3,
						self.BLOCKSIZE * 0.6,
						self.BLOCKSIZE * 0.6
					);
				}
			};
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
			}
			if (this.gameState.turn == 1) {
				this.ctx.fillStyle = GameConfig.Colors.ATTACKFILLCOLOR;
				this.ctx.strokeStyle = GameConfig.Colors.ATTACKBORDERCOLOR;
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
			if (this.gameState.select == this.gameState.ball) {
				const passlist = getPassList(
					copyArray(this.gameState.pos),
					this.gameState.turn,
					this.gameState.select,
					this.gameState.ball
				);
				this.ctx.fillStyle = GameConfig.Colors.BALLCOLOR;
				this.ctx.globalAlpha = 0.6;
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
	}
}

