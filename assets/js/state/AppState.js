/* --------------------------------------------------------------------------
 * Application State
 * アプリケーション全体の状態を管理
 * -------------------------------------------------------------------------- */

/**
 * アプリケーション状態を管理するクラス
 */
export class AppState {
	constructor() {
		// ゲーム進行フラグ
		this.gameEndFlag = 0;
		this.AIthinkFlag = 0;
		this.restartFlag = 0;

		// マウス座標
		this.mouseX = 0;
		this.mouseY = 0;
		this.mouseBlockX = 0;
		this.mouseBlockY = 0;

		// プレイヤー数
		this.attackStoneNum = 0;
		this.defenseStoneNum = 0;

		// ロール設定
		this.Role = ["human", "human", "sample1"]; // [ディフェンス, アタック, 解析用AI]
		this.anaRole = ["DefenseSample1", "AttackAI"];

		// 勝敗数
		this.attack_wins = 0;
		this.defense_wins = 0;

		// DOM参照（初期化時に設定）
		this.canvas = null;
		this.ctx = null;
		this.renderer = null;

		// 初期配置編集モード
		this.positionEditMode = false;
		this.editingPOSATTACK = [];
		this.editingPOSDEFENSE = [];
	}

	/**
	 * DOM参照を設定
	 * @param {HTMLCanvasElement} canvas - キャンバス要素
	 * @param {CanvasRenderingContext2D} ctx - コンテキスト
	 */
	setCanvas(canvas, ctx) {
		this.canvas = canvas;
		this.ctx = ctx;
	}

	/**
	 * レンダラーを設定
	 * @param {Object} renderer - レンダラーインスタンス
	 */
	setRenderer(renderer) {
		this.renderer = renderer;
	}
}

// シングルトンインスタンス
export const appState = new AppState();

