/* --------------------------------------------------------------------------
 * Game Configuration
 * ゲーム設定値と定数を定義
 * -------------------------------------------------------------------------- */

// ゲーム係数設定
export const GameCoefficients = {
	// 移動用係数
	A: 0, // ゴールラインに対する前後の移動距離の係数
	B: 1, // ディフェンスとの最短距離の係数
	// パス用係数
	C: 1, // パスを受けるプレイヤーとディフェンスとの最短距離の係数
	D: 1, // ボールを持っているプレイヤーとディフェンスとの最短距離の係数
	E: 1, // パスの距離の係数
};

// ボード設定
export const BoardConfig = {
	BOARDSIZE: 20,
	BLOCKSIZE: 30, // 1マスのサイズ
	CANVASSIZE: 600, // ボードのサイズ
	NUMSIZE: 20, // ボード横の番号幅
	ANALYSISSIZE: 20, // 解析結果の数字の大きさ
};

// ゲームルール設定
export const GameRules = {
	MAXTAG: 4, // この回数タグをとられるとアタックの負け
	CATCH_PROBABILITY_LIST: [1, 1, 1, 1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4], // キャッチできる確率
};

// パス設定
export const MAX_PASS_LENGTH = GameRules.CATCH_PROBABILITY_LIST.length - 1; // ボールが投げられる最大距離

// タイミング設定
export const TimingConfig = {
	DELAYDURATION: 1500, // 打ってから反映するまでの時間
	ENDDURATION: 1000, // AI同士でゲーム終了してから次のゲーム開始までの時間
};

// ボード座標ラベル
export const boardWordHor = new Array(
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
	"10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"
);

export const boardWordVer = new Array(
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
	"10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"
);

// 色設定
export const Colors = {
	BOARDCOLOR: "#f4f8ff",
	ATTACKFILLCOLOR: "#3FB6EA",
	ATTACKBORDERCOLOR: "#000000",
	DEFENSEFILLCOLOR: "#D11036",
	DEFENSEBORDERCOLOR: "#000000",
	BOARDERCOLOR: "#3f3f3f",
	BACKGROUNDCOLOR: "#ffffff",
	FONTCOLOR: "#3f3f3f",
	ANAMOVEFONTCOLOR: "#3f3f3f",
	ANAPASSFONTCOLOR: "#ffffff",
	INGOALCOLOR: "#F27575",
	BALLCOLOR: "#c65353",
	SELECTDISC: "#3f3f3f",
	FINALDISC: "#c65353",
};

// タグ画像
export const TAG_IMG = '<img src="./assets/img/tag.png" width="20px">';

// 初期配置
export const InitialPositions = {
	POSATTACK: [
		// アタックの位置の初期設定
		[3, 10], // 1人目
		[6, 10], // 2人目
		[9, 10], // 3人目
		[12, 10], // 4人目
		[15, 10], // 5人目
	],
	POSDEFENSE: [
		// ディフェンスの位置の初期設定
		[3, 7], // 1人目
		[5, 7], // 2人目
		[7, 7], // 3人目
		[9, 7], // 4人目
		[11, 7], // 5人目
	],
};

// サンプル設定
export const sample = {
	1: {
		boardsize: 6,
		attackpos: [[4, 5]],
		defensepos: [[5, 4]],
	},
	2: {
		boardsize: 6,
		attackpos: [[0, 4]],
		defensepos: [[4, 2]],
	},
	3: {
		boardsize: 6,
		attackpos: [[3, 4]],
		defensepos: [[3, 2]],
	},
	4: {
		boardsize: 6,
		attackpos: [
			[0, 3],
			[5, 3],
		],
		defensepos: [
			[1, 1],
			[2, 1],
		],
	},
	5: {
		boardsize: 6,
		attackpos: [
			[0, 3],
			[4, 3],
		],
		defensepos: [
			[1, 1],
			[3, 1],
		],
	},
	6: {
		boardsize: 6,
		attackpos: [
			[0, 3],
			[4, 3],
		],
		defensepos: [
			[2, 2],
			[3, 4],
		],
	},
};

// すべての設定をまとめたオブジェクト
export const GameConfig = {
	GameCoefficients,
	BoardConfig,
	GameRules,
	MAX_PASS_LENGTH,
	TimingConfig,
	boardWordHor,
	boardWordVer,
	Colors,
	TAG_IMG,
	InitialPositions,
	sample,
};


