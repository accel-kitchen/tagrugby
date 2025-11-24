/* --------------------------------------------------------------------------
 * Position Editor
 * 初期配置をドラッグ&ドロップで編集する機能
 * -------------------------------------------------------------------------- */

import { GameConfig } from '../config/GameConfig.js';

/**
 * 初期配置エディタークラス
 */
export class PositionEditor {
	constructor(renderer, appState) {
		this.renderer = renderer;
		this.appState = appState;
		// クリック検出用
		this.clickHandler = null;
		
		// 盤面外のコマ表示領域
		this.attackPiecesArea = null;
		this.defensePiecesArea = null;
		this.unplacedAttackPieces = [];
		this.unplacedDefensePieces = [];
		
		// 編集中の位置データ
		this.editingPositions = {
			attack: [],
			defense: []
		};
	}

	/**
	 * 編集モードを有効化
	 */
	enable() {
		this.appState.positionEditMode = true;
		
		// 現在の位置をコピー（gameStateから取得、なければwindowから）
		if (this.renderer && this.renderer.gameState) {
			this.editingPositions.attack = (this.renderer.gameState.pos[1] || []).map(pos => [...pos]);
			this.editingPositions.defense = (this.renderer.gameState.pos[0] || []).map(pos => [...pos]);
		} else if (typeof window !== 'undefined') {
			this.editingPositions.attack = (window.POSATTACK || []).map(pos => [...pos]);
			this.editingPositions.defense = (window.POSDEFENSE || []).map(pos => [...pos]);
		}
		
		
		this.setupClickPlacement();
	}

	/**
	 * 編集モードを無効化
	 */
	disable() {
		this.appState.positionEditMode = false;
		this.cleanupClickPlacement();
	}

	/**
	 * ドラッグ&ドロップのセットアップ
	 */
	setupClickPlacement() {
		if (!this.renderer || !this.renderer.stage) {
			console.warn('[PositionEditor] renderer or stage not available');
			return;
		}

		const stage = this.renderer.stage;
		
		// 既存のイベントリスナーを削除
		this.cleanupClickPlacement();
		
		this.clickHandler = (e) => {
			if (!this.appState || !this.appState.positionEditMode) return;
			
			const pointerPos = stage.getPointerPosition();
			if (!pointerPos) return;
			
			const gridX = Math.floor((pointerPos.x - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);
			const gridY = Math.floor((pointerPos.y - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);
			
			if (gridX < 0 || gridX >= this.renderer.BOARDSIZE ||
				gridY < 0 || gridY >= this.renderer.BOARDSIZE) {
				return;
			}
			
			const pieceInfo = this.getPieceInfoAt(gridX, gridY);
			
			if (!pieceInfo) {
				this.editingPositions.attack.push([gridX, gridY]);
			} else if (pieceInfo.type === 'attack') {
				if (this.isBallHolder(pieceInfo)) {
					console.warn('[PositionEditor] Cannot remove the ball carrier');
					e.cancelBubble = true;
					if (e.evt) {
						e.evt.preventDefault();
						e.evt.stopPropagation();
					}
					return;
				}
				const [pos] = this.editingPositions.attack.splice(pieceInfo.index, 1);
				this.editingPositions.defense.push(pos);
				this.updateBallIndexAfterRemoval(pieceInfo.index);
			} else if (pieceInfo.type === 'defense') {
				this.editingPositions.defense.splice(pieceInfo.index, 1);
			}
			
			this.updateWindowAndGameState();
			
			if (this.renderer) {
				this.renderer.needsFullRedraw = true;
				this.renderer.draw();
			}
			
			e.cancelBubble = true;
			if (e.evt) {
				e.evt.preventDefault();
				e.evt.stopPropagation();
			}
		};
		
		stage.on('click.positionEditor', this.clickHandler);
	}

	/**
	 * ドラッグ&ドロップのクリーンアップ
	 * 注意: 'click'イベントは削除しない（通常のゲーム処理で使用されているため）
	 */
	cleanupClickPlacement() {
		if (!this.renderer || !this.renderer.stage) return;
		
		const stage = this.renderer.stage;
		stage.off('click.positionEditor');
	}

	getPieceInfoAt(gridX, gridY) {
		for (let i = 0; i < this.editingPositions.attack.length; i++) {
			if (this.editingPositions.attack[i][0] === gridX && this.editingPositions.attack[i][1] === gridY) {
				return { type: 'attack', index: i };
			}
		}
		
		for (let i = 0; i < this.editingPositions.defense.length; i++) {
			if (this.editingPositions.defense[i][0] === gridX && this.editingPositions.defense[i][1] === gridY) {
				return { type: 'defense', index: i };
			}
		}
		
		return null;
	}

	getBallIndex() {
		if (this.renderer && this.renderer.gameState && typeof this.renderer.gameState.ball === 'number') {
			return this.renderer.gameState.ball;
		}
		return null;
	}
	
	isBallHolder(pieceInfo) {
		const ballIndex = this.getBallIndex();
		return ballIndex !== null && pieceInfo.type === 'attack' && pieceInfo.index === ballIndex;
	}
	
	updateBallIndexAfterRemoval(removedIndex) {
		const ballIndex = this.getBallIndex();
		if (ballIndex === null) return;
		if (ballIndex > removedIndex) {
			if (this.renderer && this.renderer.gameState) {
				this.renderer.gameState.ball = ballIndex - 1;
			}
		}
	}

	/**
	 * ドロップ位置のインジケーターを更新
	 */
	/**
	 * 編集結果を保存
	 */
	save() {
		if (typeof window !== 'undefined') {
			window.POSATTACK = this.editingPositions.attack.map(pos => [...pos]);
			window.POSDEFENSE = this.editingPositions.defense.map(pos => [...pos]);
		}
	}

	/**
	 * 編集をキャンセル
	 */
	cancel() {
		// 元の位置に戻す
		if (typeof window !== 'undefined') {
			this.editingPositions.attack = (window.POSATTACK || []).map(pos => [...pos]);
			this.editingPositions.defense = (window.POSDEFENSE || []).map(pos => [...pos]);
		}
	}

	/**
	 * windowとgameStateを更新
	 */
	updateWindowAndGameState() {
		if (typeof window !== 'undefined') {
			window.POSATTACK = this.editingPositions.attack.map(pos => [...pos]);
			window.POSDEFENSE = this.editingPositions.defense.map(pos => [...pos]);
		}
		
		if (this.renderer && this.renderer.gameState) {
			this.renderer.gameState.pos[1] = this.editingPositions.attack.map(pos => [...pos]);
			this.renderer.gameState.pos[0] = this.editingPositions.defense.map(pos => [...pos]);
		}
	}
}

