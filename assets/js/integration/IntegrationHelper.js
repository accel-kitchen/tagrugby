/* --------------------------------------------------------------------------
 * Integration Helper
 * 既存コードと新しいモジュール構造を統合するためのヘルパー
 * このファイルは既存のTagRugby-core.jsの先頭に追加して使用
 * -------------------------------------------------------------------------- */

// 注意: このファイルはES6モジュール形式ですが、
// 既存のコードと統合するにはバンドラーまたは手動統合が必要です

// 新しいモジュールから必要な関数と変数をインポート
import { GameConfig } from './config/GameConfig.js';
import { getMovableList, getPassList, checkMate } from './game/ActionValidator.js';
import { stepPhase, taggedStepPhase } from './game/TurnManager.js';
import { tryCatch } from './game/GameRules.js';
import { tagJudge, tryJudge, catchable } from './utils/validation.js';
import { copyArray } from './utils/array.js';
import { arrayTurn } from './utils/gameUtils.js';
import { rugby_AI, registerAI } from './ai/AIRegistry.js';
import { getParamForMove, getParamForThrow, posSortTraverse, disDefense, returnResult } from './game/AIParameterHelper.js';
import { distance, sum, catchProb, probJudge } from './utils/math.js';
import { xsort, transpose, addIndex, sortNum } from './utils/array.js';
import { getDefenseDistanceArray, getAttackDistanceArray, checkDistance } from './utils/validation.js';
import { GameController } from './game/GameController.js';
import { CanvasRenderer } from './rendering/CanvasRenderer.js';
import { refreshParam } from './rendering/UIRefresher.js';
import { resizeCanvas } from './rendering/CanvasResizer.js';
import { appState } from './state/AppState.js';

// 既存コードとの互換性のため、グローバル変数を設定
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

	// ゲーム係数
	window.A = GameConfig.GameCoefficients.A;
	window.B = GameConfig.GameCoefficients.B;
	window.C = GameConfig.GameCoefficients.C;
	window.D = GameConfig.GameCoefficients.D;
	window.E = GameConfig.GameCoefficients.E;

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
	window.distance = distance;
	window.sum = sum;
	window.catch_prob = (x1, y1, x2, y2) => catchProb(x1, y1, x2, y2, GameConfig.GameRules.CATCH_PROBABILITY_LIST);
	window.prob_judge = probJudge;
	window.xsort = xsort;
	window.transpose = transpose;
	window.addIndex = addIndex;
	window.sortNum = sortNum;
	window.arrayTurn = arrayTurn;
	window.dis_defense_arr_func = getDefenseDistanceArray;
	window.dis_attack_arr_func = getAttackDistanceArray;
	window.check_func = checkDistance;
	window.getParamForMove = getParamForMove;
	window.getParamForThrow = getParamForThrow;
	window.PosSortTraverse = posSortTraverse;
	window.disDefense = disDefense;
	window.returnResult = (movablelist, passlist, pos, turn, select, ball, eval_list) =>
		returnResult(movablelist, passlist, pos, turn, select, ball, eval_list, checkMate);
	
	// Array.prototype.copyを維持（既存コードとの互換性のため）
	if (!Array.prototype.copy) {
		Array.prototype.copy = function() {
			return copyArray(this);
		};
	}

	// rugby_AIをグローバルに公開
	window.rugby_AI = rugby_AI;
	window.registerAI = registerAI;

	// Gameクラスのエイリアス（既存コードとの互換性のため）
	window.Game = GameController;
	window.GameController = GameController;

	// CanvasRendererとUIRefresherをグローバルに公開
	window.CanvasRenderer = CanvasRenderer;
	window.refreshParam = refreshParam;
	window.resizeCanvas = resizeCanvas;
}

// エクスポート
export {
	GameConfig,
	GameController,
	CanvasRenderer,
	refreshParam,
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

