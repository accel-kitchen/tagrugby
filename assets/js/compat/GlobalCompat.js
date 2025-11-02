/* --------------------------------------------------------------------------
 * Compatibility Layer
 * 既存コードとの互換性を保つためのラッパー
 * グローバル変数をエクスポート
 * -------------------------------------------------------------------------- */

// 既存のグローバル変数との互換性を保つため、windowオブジェクトに公開
// ただし、新しいモジュール構造を使用するように段階的に移行

import { GameConfig } from './config/GameConfig.js';
import { appState } from './state/AppState.js';

// グローバル変数をエクスポート（既存コードとの互換性のため）
export const globalConfig = {
	// ゲーム係数
	A: GameConfig.GameCoefficients.A,
	B: GameConfig.GameCoefficients.B,
	C: GameConfig.GameCoefficients.C,
	D: GameConfig.GameCoefficients.D,
	E: GameConfig.GameCoefficients.E,

	// ボード設定
	BOARDSIZE: GameConfig.BoardConfig.BOARDSIZE,
	BLOCKSIZE: GameConfig.BoardConfig.BLOCKSIZE,
	CANVASSIZE: GameConfig.BoardConfig.CANVASSIZE,
	NUMSIZE: GameConfig.BoardConfig.NUMSIZE,
	ANALYSISSIZE: GameConfig.BoardConfig.ANALYSISSIZE,

	// ゲームルール
	MAXTAG: GameConfig.GameRules.MAXTAG,
	CATCH_PROBABILITY_LIST: GameConfig.GameRules.CATCH_PROBABILITY_LIST,
	MAX_PASS_LENGTH: GameConfig.MAX_PASS_LENGTH,

	// タイミング設定
	DELAYDURATION: GameConfig.TimingConfig.DELAYDURATION,
	ENDDURATION: GameConfig.TimingConfig.ENDDURATION,

	// 座標ラベル
	boardWordHor: GameConfig.boardWordHor,
	boardWordVer: GameConfig.boardWordVer,

	// 色設定
	BOARDCOLOR: GameConfig.Colors.BOARDCOLOR,
	ATTACKFILLCOLOR: GameConfig.Colors.ATTACKFILLCOLOR,
	ATTACKBORDERCOLOR: GameConfig.Colors.ATTACKBORDERCOLOR,
	DEFENSEFILLCOLOR: GameConfig.Colors.DEFENSEFILLCOLOR,
	DEFENSEBORDERCOLOR: GameConfig.Colors.DEFENSEBORDERCOLOR,
	BOARDERCOLOR: GameConfig.Colors.BOARDERCOLOR,
	BACKGROUNDCOLOR: GameConfig.Colors.BACKGROUNDCOLOR,
	FONTCOLOR: GameConfig.Colors.FONTCOLOR,
	ANAMOVEFONTCOLOR: GameConfig.Colors.ANAMOVEFONTCOLOR,
	ANAPASSFONTCOLOR: GameConfig.Colors.ANAPASSFONTCOLOR,
	INGOALCOLOR: GameConfig.Colors.INGOALCOLOR,
	BALLCOLOR: GameConfig.Colors.BALLCOLOR,
	SELECTDISC: GameConfig.Colors.SELECTDISC,
	FINALDISC: GameConfig.Colors.FINALDISC,
	TAG_IMG: GameConfig.TAG_IMG,

	// 初期配置
	POSATTACK: GameConfig.InitialPositions.POSATTACK,
	POSDEFENSE: GameConfig.InitialPositions.POSDEFENSE,

	// サンプル設定
	sample: GameConfig.sample,
};

// グローバルスコープに公開（既存コードとの互換性のため）
if (typeof window !== 'undefined') {
	Object.assign(window, globalConfig);
}

export default globalConfig;

