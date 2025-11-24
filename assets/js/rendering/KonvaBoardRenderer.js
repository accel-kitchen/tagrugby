/* --------------------------------------------------------------------------
 * Konva Board Renderer
 * Konva.jsを使用した盤面レンダラー
 * -------------------------------------------------------------------------- */

import { GameConfig } from '../config/GameConfig.js';
import { arrayTurn } from '../utils/gameUtils.js';
import { getMovableList } from '../game/ActionValidator.js';
import { getPassList } from '../game/ActionValidator.js';
import { copyArray } from '../utils/array.js';
import { AnimationManager } from './AnimationManager.js';

/**
 * Konva盤面レンダラークラス
 */
export class KonvaBoardRenderer {
	constructor(containerId, gameState, appState, animationManager = null) {
		this.containerId = containerId;
		this.container = document.getElementById(containerId);
		if (!this.container) {
			throw new Error(`Container with id "${containerId}" not found`);
		}

		this.gameState = gameState;
		this.appState = appState;
		// window.BOARDSIZEが設定されている場合はそれを使用、なければBoardConfig.BOARDSIZEを使用
		this.BLOCKSIZE = GameConfig.BoardConfig.BLOCKSIZE;
		this.BOARDSIZE = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : GameConfig.BoardConfig.BOARDSIZE;
		this.NUMSIZE = GameConfig.BoardConfig.NUMSIZE;
		this.CANVASSIZE = GameConfig.BoardConfig.CANVASSIZE;
		this.animationManager = animationManager || new AnimationManager();
		
		// アニメーションを無効化（即座に処理を実行）
		this.animationManager.setSpeed(0);
		
		// デバイス検出と性能設定
		this.isMobile = this.detectMobileDevice();
		this.targetFPS = this.isMobile ? 30 : 60; // モバイルは30fps、デスクトップは60fps
		this.lastDrawTime = 0;
		this.frameInterval = 1000 / this.targetFPS;
		
		// 静的要素のキャッシュ状態
		this.staticCacheValid = false;
		this.needsFullRedraw = true;
		
		// Konva StageとLayerの初期化
		this.stage = null;
		this.backgroundLayer = null;
		this.gridLayer = null;
		this.labelsLayer = null; // 座標ラベル用の静的レイヤー
		this.piecesLayer = null;
		this.uiLayer = null;
		
		// Konvaノードのキャッシュ
		this.backgroundRect = null;
		this.goalRect = null;
		this.gridLines = [];
		this.playerCircles = [];
		this.ballImage = null;
		this.ballNode = null;
		this.selectHighlight = null;
		this.movableIndicators = [];
		this.passIndicators = [];
		this.tagEffect = null;
		this.feedbackTexts = [];
		this.coordinateLabels = [];
		this.playerEventTexts = []; // プレイヤーイベント表示用
		this.activePlayerEvents = []; // アクティブなプレイヤーイベント
		
		// 解析評価値データ
		this.evalList = null;
		this.actionList = null;
		this.movableList = null;
		
		// 初期配置編集モード
		this.positionEditor = null;
		
		// ボール画像の読み込み
		this.ballImageObj = null;
		this.loadBallImage();
		
		// 初期化
		this.initStage();
	}

	/**
	 * モバイルデバイスを検出
	 */
	detectMobileDevice() {
		if (typeof window === 'undefined') return false;
		const ua = window.navigator.userAgent || window.navigator.vendor || window.opera;
		return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
	}

	/**
	 * ボール画像を読み込む
	 */
	loadBallImage() {
		const ball = new Image();
		ball.src = "./assets/img/ball.svg";
		const self = this;
		ball.onload = () => {
			self.ballImageObj = ball;
		};
	}

	/**
	 * Konva Stageを初期化
	 */
	initStage() {
		const width = this.CANVASSIZE + this.NUMSIZE;
		const height = this.CANVASSIZE + this.NUMSIZE;
		
		this.stage = new Konva.Stage({
			container: this.containerId,
			width: width,
			height: height,
			listening: true, // イベントリスニングを有効化
		});
		
		// タッチイベントを有効化（デスクトップでも動作）
		this.stage.content.addEventListener('touchstart', (e) => {
			e.preventDefault();
		}, { passive: false });
		
		this.stage.content.addEventListener('touchmove', (e) => {
			e.preventDefault();
		}, { passive: false });
		
		this.stage.content.addEventListener('touchend', (e) => {
			e.preventDefault();
		}, { passive: false });

		// レイヤーを作成
		this.backgroundLayer = new Konva.Layer();
		this.gridLayer = new Konva.Layer();
		this.labelsLayer = new Konva.Layer(); // 座標ラベル用の静的レイヤー
		this.piecesLayer = new Konva.Layer();
		this.uiLayer = new Konva.Layer();

		this.stage.add(this.backgroundLayer);
		this.stage.add(this.gridLayer);
		this.stage.add(this.labelsLayer); // グリッドの後に座標ラベルを追加
		this.stage.add(this.piecesLayer);
		this.stage.add(this.uiLayer);
	}

	/**
	 * サイズを更新（キャンバスリサイズ時など）
	 */
	updateSize(blocksize, boardsize, numsize, canvassize) {
		this.BLOCKSIZE = blocksize;
		this.BOARDSIZE = boardsize;
		this.NUMSIZE = numsize;
		this.CANVASSIZE = canvassize;
		
		// Stageサイズを更新
		if (this.stage) {
			this.stage.width(this.CANVASSIZE + this.NUMSIZE);
			this.stage.height(this.CANVASSIZE + this.NUMSIZE);
		}
		
		// サイズ変更時は静的キャッシュを無効化
		this.staticCacheValid = false;
		this.needsFullRedraw = true;
	}

	/**
	 * 最終位置のディスクを描画
	 * @param {number} x - x座標
	 * @param {number} y - y座標
	 */
	drawFinalDisc(x, y) {
		// UIレイヤーに描画
		const centerX = x * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
		const centerY = y * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
		const radius = (this.BLOCKSIZE / 2) * 0.8;
		
		const disc = new Konva.Circle({
			x: centerX,
			y: centerY,
			radius: radius,
			fill: "#FFFFFF",
			stroke: GameConfig.Colors.FONTCOLOR,
			strokeWidth: 1,
		});
		
		this.uiLayer.add(disc);
		this.uiLayer.draw();
	}

	/**
	 * ゲーム盤面を描画
	 * @param {Function} refreshParamFunc - パラメータ更新関数
	 */
	draw(refreshParamFunc) {
		if (refreshParamFunc) {
			refreshParamFunc();
		}

		// フレームレート制限（モバイル用）
		const now = performance.now();
		if (now - this.lastDrawTime < this.frameInterval && this.animationManager.hasActiveAnimations()) {
			// まだ描画時間でない場合は次のフレームで再スケジュール
			requestAnimationFrame(() => {
				this.draw(refreshParamFunc);
			});
			return;
		}
		this.lastDrawTime = now;

		const hasAnimations = this.animationManager.hasActiveAnimations();
		
		// 全描画が必要な場合（初期描画、サイズ変更、全要素更新）
		if (this.needsFullRedraw || !hasAnimations) {
			// すべてのレイヤーをクリア（編集モード中でも一度クリアして再描画）
			this.backgroundLayer.destroyChildren();
			this.gridLayer.destroyChildren();
			this.labelsLayer.destroyChildren();
			this.piecesLayer.destroyChildren();
			this.uiLayer.destroyChildren();
			
			// キャッシュをクリア
			this.backgroundRect = null;
			this.goalRect = null;
			this.gridLines = [];
			this.playerCircles = [];
			this.ballNode = null;
			this.selectHighlight = null;
			this.movableIndicators = [];
			this.passIndicators = [];
			this.tagEffect = null;
			this.feedbackTexts = [];
			this.coordinateLabels = [];
			this.playerEventTexts = [];

			// 背景の描画
			this.drawBackground();
			
			// グリッドの描画
			this.drawGrid();
			
			// 座標ラベルの描画
			this.drawCoordinateLabels();
			
			// 静的要素にキャッシュを適用
			if (!this.staticCacheValid) {
				this.cacheStaticLayers();
				this.staticCacheValid = true;
			}
			
			// 可動範囲の表示（編集モード中は非表示）
			if (!(this.appState && this.appState.positionEditMode)) {
				this.drawMovableIndicators();
			}
			
			// 選択ハイライトの描画（編集モード中は非表示）
			if (!(this.appState && this.appState.positionEditMode)) {
				this.drawSelectHighlight();
			}
			
			// プレイヤーの描画（編集モード中でも必ず描画）
			this.drawPlayers();
			
			// ボールの描画
			this.drawBall();
			
			// タグエフェクトの描画
			this.drawTagEffect();
			
			// フィードバックエフェクトの描画
			this.drawFeedbackEffects();
			
			// プレイヤーイベントの描画
			this.drawPlayerEvents();
			
			// 解析評価値の描画
			this.drawAnalysisValues();
			
			this.needsFullRedraw = false;
		} else {
			// アニメーション中は動的要素のみ更新
			// 編集モード中は全要素を再描画（コマの位置が変わる可能性があるため）
			if (this.appState && this.appState.positionEditMode) {
				// 編集モード中は全描画と同様に処理（ただし可動範囲と選択ハイライトは非表示）
				this.piecesLayer.destroyChildren();
				this.uiLayer.destroyChildren();
				this.drawPlayers();
				this.drawBall();
				this.drawTagEffect();
				this.drawFeedbackEffects();
				this.drawPlayerEvents();
				this.drawAnalysisValues();
			} else {
				// 通常のアニメーション中は動的要素のみ更新
				this.piecesLayer.destroyChildren();
				this.uiLayer.destroyChildren();
				this.drawSelectHighlight();
				this.drawMovableIndicators();
				this.drawPlayers();
				this.drawBall();
				this.drawTagEffect();
				this.drawFeedbackEffects();
				this.drawPlayerEvents();
				this.drawAnalysisValues();
			}
		}
		
		// バッチ描画で最適化
		this.stage.batchDraw();
		
		// アニメーション中またはアクティブなプレイヤーイベントがある場合は次のフレームで再描画をスケジュール
		if (hasAnimations || (this.activePlayerEvents && this.activePlayerEvents.length > 0)) {
			requestAnimationFrame(() => {
				this.draw(refreshParamFunc);
			});
		}
	}

	/**
	 * 静的レイヤーにキャッシュを適用
	 */
	cacheStaticLayers() {
		// 背景レイヤー、グリッドレイヤー、座標ラベルレイヤーをキャッシュ
		if (this.backgroundLayer && this.backgroundLayer.children.length > 0) {
			try {
				this.backgroundLayer.cache();
			} catch (e) {
				console.warn('Failed to cache background layer:', e);
			}
		}
		if (this.gridLayer && this.gridLayer.children.length > 0) {
			try {
				this.gridLayer.cache();
			} catch (e) {
				console.warn('Failed to cache grid layer:', e);
			}
		}
		if (this.labelsLayer && this.labelsLayer.children.length > 0) {
			try {
				this.labelsLayer.cache();
			} catch (e) {
				console.warn('Failed to cache labels layer:', e);
			}
		}
	}

	/**
	 * 全描画が必要な状態にマーク（外部から呼び出し可能）
	 */
	markForFullRedraw() {
		this.needsFullRedraw = true;
		this.staticCacheValid = false;
	}

	/**
	 * 背景を描画
	 */
	drawBackground() {
		// ボード背景
		this.backgroundRect = new Konva.Rect({
			x: this.NUMSIZE + 0.5,
			y: this.NUMSIZE + this.BLOCKSIZE + 0.5,
			width: this.BLOCKSIZE * this.BOARDSIZE,
			height: this.BLOCKSIZE * (this.BOARDSIZE - 1),
			fill: GameConfig.Colors.BOARDCOLOR,
			stroke: null,
		});
		this.backgroundLayer.add(this.backgroundRect);

		// ゴールエリア（グラデーション）
		this.goalRect = new Konva.Rect({
			x: this.NUMSIZE + 0.5,
			y: this.NUMSIZE + 0.5,
			width: this.BLOCKSIZE * this.BOARDSIZE,
			height: this.BLOCKSIZE,
			fillLinearGradientStartPointX: this.NUMSIZE + 0.5,
			fillLinearGradientStartPointY: this.NUMSIZE + 0.5,
			fillLinearGradientEndPointX: this.NUMSIZE + 0.5,
			fillLinearGradientEndPointY: this.NUMSIZE + this.BLOCKSIZE + 0.5,
			fillLinearGradientColorStops: [0, "#FF6B35", 0.5, "#FF8C42", 1, "#FF6B35"],
			stroke: null,
		});
		this.backgroundLayer.add(this.goalRect);

		// ボード脇の背景
		const sideRect1 = new Konva.Rect({
			x: 0,
			y: 0,
			width: this.CANVASSIZE + this.NUMSIZE,
			height: this.NUMSIZE,
			fill: GameConfig.Colors.BACKGROUNDCOLOR,
			stroke: null,
		});
		const sideRect2 = new Konva.Rect({
			x: 0,
			y: 0,
			width: this.NUMSIZE,
			height: this.CANVASSIZE + this.NUMSIZE,
			fill: GameConfig.Colors.BACKGROUNDCOLOR,
			stroke: null,
		});
		this.backgroundLayer.add(sideRect1);
		this.backgroundLayer.add(sideRect2);
	}

	/**
	 * グリッドを描画
	 */
	drawGrid() {
		for (let i = 0; i <= this.BOARDSIZE; i++) {
			// 縦線
			const vLine = new Konva.Line({
				points: [
					i * this.BLOCKSIZE + this.NUMSIZE + 0.5, 0.5,
					i * this.BLOCKSIZE + this.NUMSIZE + 0.5, this.CANVASSIZE + this.NUMSIZE + 0.5
				],
				stroke: GameConfig.Colors.BOARDERCOLOR,
				strokeWidth: 1.5,
			});
			this.gridLines.push(vLine);
			this.gridLayer.add(vLine);

			// 横線
			const hLine = new Konva.Line({
				points: [
					0.5, i * this.BLOCKSIZE + this.NUMSIZE + 0.5,
					this.CANVASSIZE + this.NUMSIZE + 0.5, i * this.BLOCKSIZE + this.NUMSIZE + 0.5
				],
				stroke: GameConfig.Colors.BOARDERCOLOR,
				strokeWidth: 1.5,
			});
			this.gridLines.push(hLine);
			this.gridLayer.add(hLine);
		}
	}

	/**
	 * 座標ラベルを描画
	 */
	drawCoordinateLabels() {
		for (let i = 0; i < this.BOARDSIZE; i++) {
			// 横軸ラベル
			const horLabel = new Konva.Text({
				x: (i + 0.5) * this.BLOCKSIZE + this.NUMSIZE,
				y: this.NUMSIZE * 0.5,
				text: GameConfig.boardWordVer[i],
				fontSize: this.NUMSIZE * 0.8,
				fontFamily: 'Osaka',
				fill: GameConfig.Colors.FONTCOLOR,
				align: 'center',
				verticalAlign: 'middle',
			});
			horLabel.offsetX(horLabel.width() / 2);
			horLabel.offsetY(horLabel.height() / 2);
			this.coordinateLabels.push(horLabel);
			this.labelsLayer.add(horLabel); // UIレイヤーではなくlabelsLayerに追加

			// 縦軸ラベル
			const verLabel = new Konva.Text({
				x: this.NUMSIZE * 0.5,
				y: (i + 0.5) * this.BLOCKSIZE + this.NUMSIZE,
				text: GameConfig.boardWordHor[i],
				fontSize: this.NUMSIZE * 0.8,
				fontFamily: 'Osaka',
				fill: GameConfig.Colors.FONTCOLOR,
				align: 'center',
				verticalAlign: 'middle',
			});
			verLabel.offsetX(verLabel.width() / 2);
			verLabel.offsetY(verLabel.height() / 2);
			this.coordinateLabels.push(verLabel);
			this.labelsLayer.add(verLabel); // UIレイヤーではなくlabelsLayerに追加
		}
	}

	/**
	 * 選択ハイライトを描画
	 */
	drawSelectHighlight() {
		const selectX = this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][0];
		const selectY = this.gameState.pos[arrayTurn(this.gameState.turn)][this.gameState.select][1];
		
		const centerX = selectX * this.BLOCKSIZE + this.BLOCKSIZE / 2 + this.NUMSIZE;
		const centerY = selectY * this.BLOCKSIZE + this.BLOCKSIZE / 2 + this.NUMSIZE;
		
		this.selectHighlight = new Konva.Rect({
			x: selectX * this.BLOCKSIZE + this.NUMSIZE + 0.5,
			y: selectY * this.BLOCKSIZE + this.NUMSIZE + 0.5,
			width: this.BLOCKSIZE,
			height: this.BLOCKSIZE,
			fillRadialGradientStartPointX: centerX,
			fillRadialGradientStartPointY: centerY,
			fillRadialGradientStartRadius: 0,
			fillRadialGradientEndPointX: centerX,
			fillRadialGradientEndPointY: centerY,
			fillRadialGradientEndRadius: this.BLOCKSIZE / 2,
			fillRadialGradientColorStops: [0, "rgba(255, 107, 53, 0.5)", 1, "rgba(255, 107, 53, 0.2)"],
			stroke: null,
		});
		this.uiLayer.add(this.selectHighlight);
	}

	/**
	 * プレイヤーを描画
	 */
	drawPlayers() {
		// 編集モードの場合は編集中の位置を使用
		let positionsToUse = null;
		if (this.appState && this.appState.positionEditMode && this.positionEditor) {
			positionsToUse = {
				0: this.positionEditor.editingPositions.defense,
				1: this.positionEditor.editingPositions.attack
			};
		}

		for (let i = 0; i <= 1; i++) {
			const posArray = positionsToUse ? positionsToUse[i] : this.gameState.pos[i];
			for (let j = 0; j < posArray.length; j++) {
				// アニメーション中の位置を取得（編集モードではアニメーションをスキップ）
				const animPos = (this.appState && this.appState.positionEditMode) ? null : this.animationManager.getMovePosition(i, j);
				let posX, posY;
				if (animPos) {
					posX = animPos.x;
					posY = animPos.y;
				} else {
					posX = posArray[j][0];
					posY = posArray[j][1];
				}

				const centerX = posX * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
				const centerY = posY * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
				const radius = (this.BLOCKSIZE / 2) * 0.8;
				
				// グラデーションの色設定
				let fillColorStart, fillColorEnd, strokeColor;
				if (i == 0) {
					fillColorStart = "#FF4757";
					fillColorEnd = GameConfig.Colors.DEFENSEFILLCOLOR;
					strokeColor = GameConfig.Colors.DEFENSEBORDERCOLOR;
				} else {
					fillColorStart = "#74B9FF";
					fillColorEnd = GameConfig.Colors.ATTACKFILLCOLOR;
					strokeColor = GameConfig.Colors.ATTACKBORDERCOLOR;
				}
				
				const playerCircle = new Konva.Circle({
					x: centerX,
					y: centerY,
					radius: radius,
					fillRadialGradientStartPointX: centerX - radius * 0.3,
					fillRadialGradientStartPointY: centerY - radius * 0.3,
					fillRadialGradientStartRadius: 0,
					fillRadialGradientEndPointX: centerX,
					fillRadialGradientEndPointY: centerY,
					fillRadialGradientEndRadius: radius,
					fillRadialGradientColorStops: [0, fillColorStart, 1, fillColorEnd],
					stroke: strokeColor,
					strokeWidth: 2,
				});

				// 編集モードの場合はドラッグ可能にする（ボールを持っている選手も含む）
				if (this.appState && this.appState.positionEditMode) {
					playerCircle.draggable(true);
					playerCircle.name('position-editor-piece');
					playerCircle.setAttr('pieceType', i === 0 ? 'defense' : 'attack');
					playerCircle.setAttr('pieceIndex', j);
				}
				
				this.playerCircles.push(playerCircle);
				this.piecesLayer.add(playerCircle);
			}
		}
	}

	/**
	 * ボールを描画
	 */
	drawBall() {
		// パスアニメーション中かチェック
		const passPos = this.animationManager.getPassPosition();
		let ballX, ballY, ballZ = 0;
		
		// 編集モード中はアニメーションを無視して通常位置に表示
		if (this.appState && this.appState.positionEditMode) {
			// 編集モード中：ボールを持っているプレイヤーの位置に表示
			// editingPositionsを使用（drawPlayers()と同様）
			if (this.positionEditor && this.positionEditor.editingPositions &&
				this.gameState && this.gameState.ball !== undefined &&
				this.positionEditor.editingPositions.attack &&
				this.positionEditor.editingPositions.attack[this.gameState.ball]) {
				ballX = this.positionEditor.editingPositions.attack[this.gameState.ball][0];
				ballY = this.positionEditor.editingPositions.attack[this.gameState.ball][1];
			} else if (this.gameState && this.gameState.ball !== undefined && 
				this.gameState.pos && this.gameState.pos[1] && 
				this.gameState.pos[1][this.gameState.ball]) {
				// フォールバック：gameState.posを使用
				ballX = this.gameState.pos[1][this.gameState.ball][0];
				ballY = this.gameState.pos[1][this.gameState.ball][1];
			} else {
				// ボール情報が無い場合は描画しない
				return;
			}
		} else if (passPos) {
			// パスアニメーション中
			ballX = passPos.x;
			ballY = passPos.y;
			ballZ = passPos.z || 0;
		} else {
			// ボールを持っているプレイヤーが移動アニメーション中かチェック
			const ballPlayerMovePos = this.animationManager.getMovePosition(1, this.gameState.ball);
			if (ballPlayerMovePos) {
				// 移動アニメーション中：ボールも一緒に動く
				ballX = ballPlayerMovePos.x;
				ballY = ballPlayerMovePos.y;
			} else {
				// 通常位置
				ballX = this.gameState.pos[1][this.gameState.ball][0];
				ballY = this.gameState.pos[1][this.gameState.ball][1];
			}
		}

		const drawX = ballX * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE - this.BLOCKSIZE * 0.3;
		const drawY = ballY * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE - this.BLOCKSIZE * 0.3 - ballZ * this.BLOCKSIZE * 0.2;
		const ballSize = this.BLOCKSIZE * 0.6 * (1 - ballZ * 0.1);

		if (this.ballImageObj && this.ballImageObj.complete) {
			// Konva.Imageを使用
			this.ballNode = new Konva.Image({
				x: drawX,
				y: drawY,
				width: ballSize,
				height: ballSize,
				image: this.ballImageObj,
			});
			this.piecesLayer.add(this.ballNode);
		} else {
			// 画像が読み込まれていない場合は円で代用
			this.ballNode = new Konva.Circle({
				x: drawX + ballSize / 2,
				y: drawY + ballSize / 2,
				radius: ballSize / 2,
				fill: GameConfig.Colors.BALLCOLOR,
				stroke: GameConfig.Colors.FONTCOLOR,
				strokeWidth: 1,
			});
			this.piecesLayer.add(this.ballNode);
		}
	}

	/**
	 * 可動範囲インジケーターを描画
	 */
	drawMovableIndicators() {
		if (this.gameState.select == this.gameState.wait) {
			return;
		}

		const movablelist = getMovableList(
			this.gameState.pos,
			this.gameState.turn,
			this.gameState.select,
			this.gameState.tagged,
			this.BOARDSIZE
		);

		let fillColor, strokeColor;
		if (this.gameState.turn == -1) {
			fillColor = GameConfig.Colors.DEFENSEFILLCOLOR;
			strokeColor = GameConfig.Colors.DEFENSEBORDERCOLOR;
		} else {
			fillColor = GameConfig.Colors.ATTACKFILLCOLOR;
			strokeColor = GameConfig.Colors.ATTACKBORDERCOLOR;
		}

		for (let i = 0; i < movablelist.length; i++) {
			const centerX = movablelist[i][0] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			const centerY = movablelist[i][1] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			const radius = (this.BLOCKSIZE / 2) * 0.8;

			const indicator = new Konva.Circle({
				x: centerX,
				y: centerY,
				radius: radius,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: 1.5,
				opacity: 0.2,
			});
			this.movableIndicators.push(indicator);
			this.uiLayer.add(indicator);
		}

		// パス可能な位置を描画
		if (this.gameState.select == this.gameState.ball) {
			const passlist = getPassList(
				copyArray(this.gameState.pos),
				this.gameState.turn,
				this.gameState.select,
				this.gameState.ball
			);

			for (let i = 0; i < passlist.length; i++) {
				const centerX = passlist[i][0] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
				const centerY = passlist[i][1] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
				const radius = (this.BLOCKSIZE / 2) * 0.3;

				const passIndicator = new Konva.Circle({
					x: centerX,
					y: centerY,
					radius: radius,
					fill: GameConfig.Colors.BALLCOLOR,
					stroke: GameConfig.Colors.FONTCOLOR,
					strokeWidth: 1,
					opacity: 0.7,
				});
				this.passIndicators.push(passIndicator);
				this.uiLayer.add(passIndicator);
			}
		}
	}

	/**
	 * タグエフェクトを描画
	 */
	drawTagEffect() {
		const tagPos = this.animationManager.getTagPosition();
		const tagScale = this.animationManager.getTagScale();
		
		if (tagPos && tagScale) {
			const centerX = tagPos.x * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			const centerY = tagPos.y * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			const radius = (this.BLOCKSIZE / 2) * 0.8 * tagScale;
			
			const opacity = 1 - Math.abs(tagScale - 1.25) * 2;
			
			this.tagEffect = new Konva.Circle({
				x: centerX,
				y: centerY,
				radius: radius,
				fillRadialGradientStartPointX: centerX,
				fillRadialGradientStartPointY: centerY,
				fillRadialGradientStartRadius: 0,
				fillRadialGradientEndPointX: centerX,
				fillRadialGradientEndPointY: centerY,
				fillRadialGradientEndRadius: radius,
				fillRadialGradientColorStops: [
					0, "rgba(255, 107, 53, 0.8)",
					0.5, "rgba(255, 107, 53, 0.4)",
					1, "rgba(255, 107, 53, 0)"
				],
				opacity: opacity,
				stroke: null,
			});
			this.uiLayer.add(this.tagEffect);
		}
	}

	/**
	 * フィードバックエフェクトを描画
	 */
	drawFeedbackEffects() {
		const feedbackEffects = this.animationManager.getFeedbackEffects();
		
		for (const effect of feedbackEffects) {
			const screenX = effect.x * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			// 選手の上のマスに表示するため、Y座標から1マス分（BLOCKSIZE）引く
			const screenY = (effect.y - 1) * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			
			const text = new Konva.Text({
				x: screenX,
				y: screenY,
				text: effect.text,
				fontSize: 16,
				fontFamily: 'sans-serif',
				fontStyle: 'bold',
				fill: effect.color,
				align: 'center',
				verticalAlign: 'middle',
				opacity: effect.opacity,
			});
			text.offsetX(text.width() / 2);
			text.offsetY(text.height() / 2);
			
			// 影を追加
			const shadow = text.clone();
			shadow.fill('#000000');
			shadow.opacity(effect.opacity * 0.5);
			shadow.x(screenX + 1);
			shadow.y(screenY + 1);
			shadow.moveToBottom();
			
			this.uiLayer.add(shadow);
			this.uiLayer.add(text);
			this.feedbackTexts.push(text);
		}
	}

	/**
	 * プレイヤーイベントを描画
	 */
	drawPlayerEvents() {
		// 既存のテキストをクリア
		for (const textGroup of this.playerEventTexts) {
			if (textGroup.text) textGroup.text.destroy();
			if (textGroup.shadow) textGroup.shadow.destroy();
		}
		this.playerEventTexts = [];
		
		// アクティブなイベントを描画
		if (!this.activePlayerEvents) {
			this.activePlayerEvents = [];
		}
		
		const now = Date.now();
		for (let i = this.activePlayerEvents.length - 1; i >= 0; i--) {
			const event = this.activePlayerEvents[i];
			if (now > event.endTime) {
				// 時間切れのイベントを削除
				this.activePlayerEvents.splice(i, 1);
				continue;
			}
			
			const screenX = event.x * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			const screenY = (event.y - 1) * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			
			// フェードアウト効果
			const elapsed = now - event.startTime;
			const duration = event.endTime - event.startTime;
			const opacity = Math.max(0, 1 - (elapsed / duration));
			
			// テキストサイズ（大きく目立つように）
			const fontSize = Math.max(24, this.BLOCKSIZE * 0.6);
			
			// 影を先に描画
			const shadow = new Konva.Text({
				x: screenX + 2,
				y: screenY + 2,
				text: event.text,
				fontSize: fontSize,
				fontFamily: 'sans-serif',
				fontStyle: 'bold',
				fill: '#000000',
				align: 'center',
				verticalAlign: 'middle',
				opacity: opacity * 0.7,
			});
			shadow.offsetX(shadow.width() / 2);
			shadow.offsetY(shadow.height() / 2);
			
			// メインテキスト
			const text = new Konva.Text({
				x: screenX,
				y: screenY,
				text: event.text,
				fontSize: fontSize,
				fontFamily: 'sans-serif',
				fontStyle: 'bold',
				fill: event.color,
				align: 'center',
				verticalAlign: 'middle',
				opacity: opacity,
			});
			text.offsetX(text.width() / 2);
			text.offsetY(text.height() / 2);
			
			this.uiLayer.add(shadow);
			this.uiLayer.add(text);
			this.playerEventTexts.push({ text, shadow });
		}
	}

	/**
	 * プレイヤーの上にイベントテキストを表示
	 * @param {number} x - プレイヤーのx座標（ブロック座標）
	 * @param {number} y - プレイヤーのy座標（ブロック座標）
	 * @param {string} text - 表示するテキスト
	 * @param {string} color - テキストの色
	 * @param {number} duration - 表示時間（ミリ秒、デフォルト2000ms）
	 */
	showPlayerEvent(x, y, text, color = '#FF0000', duration = 2000) {
		if (!this.activePlayerEvents) {
			this.activePlayerEvents = [];
		}
		
		const now = Date.now();
		this.activePlayerEvents.push({
			x: x,
			y: y,
			text: text,
			color: color,
			startTime: now,
			endTime: now + duration
		});
		
		// 即座に再描画
		this.markForFullRedraw();
		if (this.stage) {
			this.draw(() => {});
		}
	}

	/**
	 * 解析評価値を描画
	 */
	drawAnalysisValues() {
		if (!this.evalList || !this.actionList || !this.movableList) {
			return;
		}

		const fontSize = (typeof window !== 'undefined' && window.ANALYSISSIZE) ? window.ANALYSISSIZE : GameConfig.BoardConfig.ANALYSISSIZE;

		// 移動の評価値
		for (let i = 0; i < this.movableList.length; i++) {
			if (i >= this.evalList.length) break;
			
			const centerX = this.actionList[i][0] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			const centerY = this.actionList[i][1] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			
			const evalText = new Konva.Text({
				x: centerX,
				y: centerY,
				text: Math.floor(this.evalList[i]).toString(),
				fontSize: fontSize,
				fontFamily: 'Osaka, sans-serif',
				fill: GameConfig.Colors.ANAMOVEFONTCOLOR,
				align: 'center',
				verticalAlign: 'middle',
			});
			evalText.offsetX(evalText.width() / 2);
			evalText.offsetY(evalText.height() / 2);
			
			this.uiLayer.add(evalText);
		}

		// パスの評価値
		for (let i = this.movableList.length; i < this.movableList.length + (this.actionList.length - this.movableList.length); i++) {
			if (i >= this.evalList.length) break;
			
			const centerX = this.actionList[i][0] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			const centerY = this.actionList[i][1] * this.BLOCKSIZE + this.BLOCKSIZE * 0.5 + this.NUMSIZE;
			
			const evalText = new Konva.Text({
				x: centerX,
				y: centerY,
				text: Math.floor(this.evalList[i]).toString(),
				fontSize: fontSize,
				fontFamily: 'Osaka, sans-serif',
				fill: GameConfig.Colors.ANAPASSFONTCOLOR,
				align: 'center',
				verticalAlign: 'middle',
			});
			evalText.offsetX(evalText.width() / 2);
			evalText.offsetY(evalText.height() / 2);
			
			this.uiLayer.add(evalText);
		}
	}

	/**
	 * 解析評価値を設定
	 * @param {Array} evalList - 評価値リスト
	 * @param {Array} actionList - アクションリスト（移動とパスの組み合わせ）
	 * @param {Array} movableList - 移動可能な位置のリスト
	 */
	setAnalysisValues(evalList, actionList, movableList) {
		this.evalList = evalList;
		this.actionList = actionList;
		this.movableList = movableList;
	}

	/**
	 * 解析評価値をクリア
	 */
	clearAnalysisValues() {
		this.evalList = null;
		this.actionList = null;
		this.movableList = null;
	}

	/**
	 * Stageからマウス座標を取得してブロック座標に変換
	 * @param {Object} event - イベントオブジェクト
	 * @returns {Object} {x, y} ブロック座標
	 */
	getBlockPositionFromEvent(event) {
		const pointerPos = this.stage.getPointerPosition();
		if (!pointerPos) {
			return { x: -1, y: -1 };
		}
		
		const mouseX = pointerPos.x;
		const mouseY = pointerPos.y;
		
		const mouseBlockX = Math.floor((mouseX - this.NUMSIZE - 0.5) / this.BLOCKSIZE);
		const mouseBlockY = Math.floor((mouseY - this.NUMSIZE - 0.5) / this.BLOCKSIZE);
		
		// 境界チェック
		if (mouseBlockX < 0 || mouseBlockX >= this.BOARDSIZE ||
			mouseBlockY < 0 || mouseBlockY >= this.BOARDSIZE) {
			return { x: -1, y: -1 };
		}
		
		return { x: mouseBlockX, y: mouseBlockY };
	}

	/**
	 * Stageを取得（外部からアクセス用）
	 */
	getStage() {
		return this.stage;
	}

	/**
	 * 初期配置編集モードを有効化
	 */
	enablePositionEditMode() {
		if (!this.appState) {
			console.warn('[KonvaBoardRenderer] appState not available');
			return;
		}
		
		// PositionEditorをインポートして初期化
		import('../editing/PositionEditor.js').then(({ PositionEditor }) => {
			this.positionEditor = new PositionEditor(this, this.appState);
			this.positionEditor.enable();
			this.needsFullRedraw = true;
			this.draw();
		}).catch(err => {
			console.error('[KonvaBoardRenderer] Failed to load PositionEditor:', err);
		});
	}

	/**
	 * 初期配置編集モードを無効化
	 */
	disablePositionEditMode() {
		if (this.positionEditor) {
			this.positionEditor.disable();
			this.positionEditor = null;
		}
		if (this.appState) {
			this.appState.positionEditMode = false;
		}
		this.needsFullRedraw = true;
		this.draw();
	}
}

