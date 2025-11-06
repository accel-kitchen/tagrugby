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
		this.isDragging = false;
		this.draggedPiece = null;
		this.dragStartPos = null;
		this.dragOffset = { x: 0, y: 0 };
		
		// ダブルクリック検出用
		this.lastClickTime = 0;
		this.lastClickTarget = null;
		this.doubleClickDelay = 300; // ミリ秒
		
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
		
		
		this.setupDragAndDrop();
	}

	/**
	 * 編集モードを無効化
	 */
	disable() {
		this.appState.positionEditMode = false;
		this.cleanupDragAndDrop();
	}

	/**
	 * ドラッグ&ドロップのセットアップ
	 */
	setupDragAndDrop() {
		if (!this.renderer || !this.renderer.stage) {
			console.warn('[PositionEditor] renderer or stage not available');
			return;
		}

		const stage = this.renderer.stage;
		
		// 既存のイベントリスナーを削除
		this.cleanupDragAndDrop();
		
		// ドラッグ開始
		stage.on('dragstart', (e) => {
			const target = e.target;
			// 名前でチェック（クラス名だけでは不十分な場合がある）
			if (target.name() === 'position-editor-piece' || (target.getClassName() === 'Circle' && target.hasName('position-editor-piece'))) {
				this.isDragging = true;
				this.draggedPiece = target;
				const pos = target.position();
				this.dragStartPos = { x: pos.x, y: pos.y };
				this.dragOffset = {
					x: e.evt.clientX - pos.x,
					y: e.evt.clientY - pos.y
				};
				target.opacity(0.7);
			}
		});
		
		// ダブルクリックイベント
		stage.on('dblclick', (e) => {
			if (!this.appState || !this.appState.positionEditMode) return;
			
			const target = e.target;
			const pointerPos = this.renderer.stage.getPointerPosition();
			if (!pointerPos) return;
			
			// コマがダブルクリックされた場合
			if (target.name() === 'position-editor-piece' || 
				(target.getClassName() === 'Circle' && target.hasName('position-editor-piece'))) {
				this.handlePieceDoubleClick(target);
				e.cancelBubble = true;
				if (e.evt) e.evt.stopPropagation();
			} else {
				// 盤面上の空きマスがダブルクリックされた場合
				const gridX = Math.floor((pointerPos.x - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);
				const gridY = Math.floor((pointerPos.y - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);
				
				// 盤面の境界チェック
				if (gridX >= 0 && gridX < this.renderer.BOARDSIZE &&
					gridY >= 0 && gridY < this.renderer.BOARDSIZE) {
					// その位置にコマがあるかチェック
					const existingPiece = this.findPieceAtPosition(gridX, gridY);
					if (existingPiece) {
						// 既にコマがある場合は、タイプを切り替え
						this.handlePieceDoubleClick(existingPiece);
					} else {
						// コマがない場合は新規作成
						this.createPieceAtPosition(gridX, gridY, 'attack'); // デフォルトはアタック
					}
				}
			}
		});

		// ドラッグ中
		stage.on('dragmove', (e) => {
			if (this.isDragging && this.draggedPiece) {
				// ドロップ可能位置のハイライト表示
				this.updateDropIndicator(e);
			}
		});

		// ドラッグ終了
		stage.on('dragend', (e) => {
			if (this.isDragging && this.draggedPiece) {
				this.handleDrop(e);
				this.isDragging = false;
				this.draggedPiece = null;
				this.dragStartPos = null;
			}
		});
	}

	/**
	 * ドラッグ&ドロップのクリーンアップ
	 * 注意: 'click'イベントは削除しない（通常のゲーム処理で使用されているため）
	 */
	cleanupDragAndDrop() {
		if (!this.renderer || !this.renderer.stage) return;
		
		const stage = this.renderer.stage;
		// PositionEditorが追加したイベントリスナーのみを削除
		// 'click'は削除しない（通常のゲーム処理で使用されているため）
		stage.off('dragstart');
		stage.off('dragmove');
		stage.off('dragend');
		stage.off('dblclick');
		// stage.off('click'); // 通常のゲーム処理で使用されているため削除しない
	}

	/**
	 * ドロップ位置のインジケーターを更新
	 */
	updateDropIndicator(e) {
		// TODO: ドロップ可能位置のハイライト表示
	}

	/**
	 * ドロップ処理
	 */
	handleDrop(e) {
		if (!this.draggedPiece) {
			return;
		}

		const pointerPos = this.renderer.stage.getPointerPosition();
		if (!pointerPos) {
			return;
		}

		// グリッド座標に変換
		const gridX = Math.floor((pointerPos.x - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);
		const gridY = Math.floor((pointerPos.y - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);

		// 盤面の境界チェック（編集モードでは盤面外にドロップしても削除しない）
		if (gridX < 0 || gridX >= this.renderer.BOARDSIZE ||
			gridY < 0 || gridY >= this.renderer.BOARDSIZE) {
			// 盤面外にドロップした場合は元の位置に戻す（削除はダブルクリックで行う）
			this.draggedPiece.position(this.dragStartPos);
			this.draggedPiece.opacity(1);
			return;
		}

		// 既存コマとの重複チェック
		const pieceType = this.draggedPiece.getAttr('pieceType'); // 'attack' or 'defense'
		const pieceIndex = this.draggedPiece.getAttr('pieceIndex');

		if (this.isPositionOccupied(gridX, gridY, pieceType, pieceIndex)) {
			// 重複している場合は元の位置に戻す
			this.draggedPiece.position(this.dragStartPos);
			this.draggedPiece.opacity(1);
			return;
		}

		// 位置を更新
		const centerX = gridX * this.renderer.BLOCKSIZE + this.renderer.BLOCKSIZE * 0.5 + this.renderer.NUMSIZE;
		const centerY = gridY * this.renderer.BLOCKSIZE + this.renderer.BLOCKSIZE * 0.5 + this.renderer.NUMSIZE;
		
		this.draggedPiece.position({ x: centerX, y: centerY });
		this.draggedPiece.opacity(1);

		// 位置データを更新
		if (pieceType === 'attack') {
			this.editingPositions.attack[pieceIndex] = [gridX, gridY];
		} else if (pieceType === 'defense') {
			this.editingPositions.defense[pieceIndex] = [gridX, gridY];
		}

		// window.POSATTACK/POSDEFENSEを更新
		if (typeof window !== 'undefined') {
			if (pieceType === 'attack') {
				window.POSATTACK = this.editingPositions.attack.map(pos => [...pos]);
			} else if (pieceType === 'defense') {
				window.POSDEFENSE = this.editingPositions.defense.map(pos => [...pos]);
			}
		}

		// gameStateも更新（編集モード中は位置が反映されるように）
		if (this.renderer && this.renderer.gameState) {
			if (pieceType === 'attack') {
				this.renderer.gameState.pos[1][pieceIndex] = [gridX, gridY];
			} else if (pieceType === 'defense') {
				this.renderer.gameState.pos[0][pieceIndex] = [gridX, gridY];
			}
		}

		// 再描画（編集モードでは全描画をスキップして、コマの位置だけ更新）
		// ドラッグ中のコマは既に位置が更新されているので、再描画は不要
		// ただし、他のコマとの重複チェックのためにレイヤーを更新
		this.renderer.piecesLayer.draw();
	}

	/**
	 * 位置が既に占有されているかチェック
	 */
	isPositionOccupied(x, y, excludeType, excludeIndex) {
		// 攻め手の位置をチェック
		for (let i = 0; i < this.editingPositions.attack.length; i++) {
			if (excludeType === 'attack' && i === excludeIndex) continue;
			if (this.editingPositions.attack[i][0] === x && this.editingPositions.attack[i][1] === y) {
				return true;
			}
		}

		// 守り手の位置をチェック
		for (let i = 0; i < this.editingPositions.defense.length; i++) {
			if (excludeType === 'defense' && i === excludeIndex) continue;
			if (this.editingPositions.defense[i][0] === x && this.editingPositions.defense[i][1] === y) {
				return true;
			}
		}

		return false;
	}

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
	 * コマのダブルクリック処理
	 * - 攻撃をダブルクリック → ディフェンスに変更
	 * - ディフェンスをダブルクリック → 削除
	 */
	handlePieceDoubleClick(piece) {
		const pieceType = piece.getAttr('pieceType');
		const pieceIndex = piece.getAttr('pieceIndex');
		
		// コマの位置を取得
		const pos = piece.position();
		const gridX = Math.floor((pos.x - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);
		const gridY = Math.floor((pos.y - this.renderer.NUMSIZE - 0.5) / this.renderer.BLOCKSIZE);
		
		if (pieceType === 'attack') {
			// アタックをディフェンスに変更
			this.editingPositions.attack.splice(pieceIndex, 1);
			this.editingPositions.defense.push([gridX, gridY]);
		} else if (pieceType === 'defense') {
			// ディフェンスを削除
			this.editingPositions.defense.splice(pieceIndex, 1);
		}
		
		this.updateWindowAndGameState();
		
		// 再描画
		if (this.renderer) {
			this.renderer.needsFullRedraw = true;
			this.renderer.draw();
		}
	}

	/**
	 * 指定位置のコマを取得
	 */
	findPieceAtPosition(gridX, gridY) {
		if (!this.renderer || !this.renderer.piecesLayer) return null;
		
		const centerX = gridX * this.renderer.BLOCKSIZE + this.renderer.BLOCKSIZE * 0.5 + this.renderer.NUMSIZE;
		const centerY = gridY * this.renderer.BLOCKSIZE + this.renderer.BLOCKSIZE * 0.5 + this.renderer.NUMSIZE;
		
		// piecesLayer内のコマを検索
		const shapes = this.renderer.piecesLayer.find('.Circle');
		for (let shape of shapes) {
			if (shape.name() === 'position-editor-piece') {
				const pos = shape.position();
				const radius = shape.radius();
				const dist = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));
				if (dist < radius) {
					return shape;
				}
			}
		}
		return null;
	}

	/**
	 * 指定位置にコマを生成
	 */
	createPieceAtPosition(gridX, gridY, defaultType) {
		
		// その位置にコマがない場合は新規作成
		if (defaultType === 'attack') {
			this.editingPositions.attack.push([gridX, gridY]);
		} else {
			this.editingPositions.defense.push([gridX, gridY]);
		}
		
		this.updateWindowAndGameState();
		
		// 再描画
		if (this.renderer) {
			this.renderer.needsFullRedraw = true;
			this.renderer.draw();
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

