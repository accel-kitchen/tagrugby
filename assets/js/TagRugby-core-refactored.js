/* --------------------------------------------------------------------------
 * TagRugby Core - Refactored Entry Point
 * リファクタリング後のエントリーポイント
 * 既存コードとの互換性を保ちながら新しいモジュール構造を使用
 * -------------------------------------------------------------------------- */

// 注意: このファイルは段階的な移行用です
// 既存のTagRugby-core.jsを段階的に新しいモジュールに置き換えるために使用

// 新しいモジュールをインポート
import { GameConfig } from './config/GameConfig.js';
import { GameState } from './game/GameState.js';
import { getMovableList, getPassList, checkMate } from './game/ActionValidator.js';
import { stepPhase, taggedStepPhase } from './game/TurnManager.js';
import { tryCatch } from './game/GameRules.js';
import { tagJudge, tryJudge, catchable } from './utils/validation.js';
import { copyArray } from './utils/array.js';
import { rugby_AI, registerAI } from './ai/AIRegistry.js';
import { createAIFunction } from './ai/AISandbox.js';
import { appState } from './state/AppState.js';

// グローバル変数との互換性のため、windowオブジェクトに公開
if (typeof window !== 'undefined') {
	// 設定値をグローバルに公開
	window.BOARDSIZE = GameConfig.BoardConfig.BOARDSIZE;
	window.BLOCKSIZE = GameConfig.BoardConfig.BLOCKSIZE;
	window.CANVASSIZE = GameConfig.BoardConfig.CANVASSIZE;
	window.NUMSIZE = GameConfig.BoardConfig.NUMSIZE;
	window.ANALYSISSIZE = GameConfig.BoardConfig.ANALYSISSIZE;
	window.MAXTAG = GameConfig.GameRules.MAXTAG;
	window.CATCH_PROBABILITY_LIST = GameConfig.GameRules.CATCH_PROBABILITY_LIST;
	window.MAX_PASS_LENGTH = GameConfig.MAX_PASS_LENGTH;
	window.DELAYDURATION = GameConfig.TimingConfig.DELAYDURATION;
	window.ENDDURATION = GameConfig.TimingConfig.ENDDURATION;
	window.boardWordHor = GameConfig.boardWordHor;
	window.boardWordVer = GameConfig.boardWordVer;
	window.TAG_IMG = GameConfig.TAG_IMG;
	window.POSATTACK = GameConfig.InitialPositions.POSATTACK;
	window.POSDEFENSE = GameConfig.InitialPositions.POSDEFENSE;
	window.sample = GameConfig.sample;

	// 色設定
	Object.assign(window, GameConfig.Colors);

	// グローバル関数との互換性のため、エイリアスを作成
	window.movablelistFunc = (pos, turn, select, tagged) => 
		getMovableList(pos, turn, select, tagged, GameConfig.BoardConfig.BOARDSIZE);
	window.passlistFunc = getPassList;
	window.CheckMateFunc = checkMate;
	window.stepPhaseFunc = stepPhase;
	window.taggedstepPhaseFunc = taggedStepPhase;
	window.tagJudgeFunc = tagJudge;
	window.tryJudgeFunc = tryJudge;
	window.catchableFunc = catchable;
	window.try_catch = tryCatch;
	
	// Array.prototype.copyを維持（既存コードとの互換性のため）
	if (!Array.prototype.copy) {
		Array.prototype.copy = function() {
			return copyArray(this);
		};
	}

	// rugby_AIをグローバルに公開
	window.rugby_AI = rugby_AI;
}

// エクスポート（モジュールとして使用する場合）
export {
	GameConfig,
	GameState,
	getMovableList,
	getPassList,
	checkMate,
	stepPhase,
	taggedStepPhase,
	tagJudge,
	tryJudge,
	catchable,
	rugby_AI,
	registerAI,
	appState,
};

