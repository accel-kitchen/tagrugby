/* --------------------------------------------------------------------------
 * Complete Integration File
 * 新しいモジュール構造を使用した完全な統合ファイル
 * 既存のTagRugby-core.jsの代替として使用可能
 * 
 * 使用方法:
 * 1. index.htmlでtype="module"を使用する場合:
 *    <script type="module" src="assets/js/TagRugby-core-v2.js"></script>
 * 
 * 2. または、バンドラーを使用してブラウザ対応形式に変換
 * -------------------------------------------------------------------------- */

// すべてのモジュールをインポート
import { GameConfig, BoardConfig } from './config/GameConfig.js';
import { GameController } from './game/GameController.js';
import { CanvasRenderer } from './rendering/CanvasRenderer.js';
import { KonvaBoardRenderer } from './rendering/KonvaBoardRenderer.js';
import { refreshParam } from './rendering/UIRefresher.js';
import { resizeCanvas } from './rendering/CanvasResizer.js';
import { appState } from './state/AppState.js';
import { getMovableList, getPassList, checkMate } from './game/ActionValidator.js';
import { stepPhase, taggedStepPhase } from './game/TurnManager.js';
import { tryCatch } from './game/GameRules.js';
import { tagJudge, tryJudge, catchable } from './utils/validation.js';
import { copyArray } from './utils/array.js';
import { arrayTurn } from './utils/gameUtils.js';
import { rugby_AI, registerAI } from './ai/AIRegistry.js';
import { createAIFunction } from './ai/AISandbox.js';
import { getParamForMove, getParamForThrow, posSortTraverse, disDefense, returnResult } from './game/AIParameterHelper.js';
import { distance, sum, catchProb, probJudge } from './utils/math.js';
import { xsort, transpose, addIndex, sortNum } from './utils/array.js';
import { getDefenseDistanceArray, getAttackDistanceArray, checkDistance } from './utils/validation.js';

// サンプルAIをインポート（既存のDefenseSample1, DefenseSample2を登録）
import './ai/AISamples.js';

// グローバル変数（既存コードとの互換性のため）
let canvas;
let ctx;
let game;
let tag = "";
let gameEndFlag = 0;
let AIthinkFlag = 0;
let restartFlag = 0;
let mouseX = 0;
let mouseY = 0;
let mouseBlockX = 0;
let mouseBlockY = 0;
let Role = ["human", "human", "sample1"];
let anaRole = ["DefenseSample1", "AttackAI"];
let attack_wins = 0;
let defense_wins = 0;
let renderer;

/**
 * ユーザーコードからセクションを抽出（コメント行を除く）
 * @param {string} code - ユーザーコード
 * @param {string} startMarker - 開始マーカー（コメント）
 * @param {string} endMarker - 終了マーカー（コメント）
 * @returns {string} 抽出されたコード（ロジック部分のみ）
 */
function extractSection(code, startMarker, endMarker) {
	const startIndex = code.indexOf(startMarker);
	if (startIndex === -1) return '';
	
	// 開始マーカー以降のコードを取得
	let fromStart = code.slice(startIndex);
	
	// 終了マーカーまでのコードを取得
	const endIndex = fromStart.indexOf(endMarker);
	if (endIndex !== -1) {
		fromStart = fromStart.slice(0, endIndex);
	}
	
	// コメント行と空行を除去し、ロジック部分だけを抽出
	const lines = fromStart.split('\n');
	let sectionLines = [];
	let inSection = false;
	
	for (const line of lines) {
		const trimmed = line.trim();
		// 開始マーカーの行をスキップ
		if (trimmed === startMarker || trimmed.startsWith(startMarker)) {
			inSection = true;
			continue;
		}
		// 終了マーカーの行で終了
		if (trimmed === endMarker || trimmed.startsWith(endMarker)) {
			break;
		}
		// セクション内のコード行を追加
		if (inSection && trimmed && !trimmed.startsWith('//')) {
			sectionLines.push(line);
		} else if (inSection && trimmed.startsWith('//')) {
			// コメント行も追加（説明用）
			sectionLines.push(line);
		}
	}
	
	return sectionLines.join('\n');
}

/**
 * 簡潔なコード形式を実行するラッパー関数
 * @param {string} userCode - ユーザーが書いたコード
 * @param {Array} pos - 位置情報
 * @param {number} turn - ターン
 * @param {number} select - 選択中のプレイヤー
 * @param {number} ball - ボールを持っているプレイヤー
 * @param {number} tagged - タグされたか
 * @returns {Array} [best_move_array, eval_list]
 */
function executeSimplifiedAI(userCode, pos, turn, select, ball, tagged) {
	let eval_list = [];
	
	// 移動とパスのセクションを抽出
	let moveSection = extractSection(userCode, '//移動の評価値計算', '//パスの評価値計算');
	let passSection = extractSection(userCode, '//パスの評価値計算', '//');
	
	// セクションが見つからない場合（マーカーコメントがない場合）、コード全体を使用
	// move_scoreとpass_scoreで自動判別されるため、コード全体を実行しても問題ない
	if (!moveSection.trim() && !passSection.trim()) {
		// マーカーコメントがない場合、コード全体を両方のセクションとして使用
		moveSection = userCode;
		passSection = userCode;
	} else if (!moveSection.trim()) {
		// 移動セクションが見つからない場合、コード全体を使用
		moveSection = userCode;
	} else if (!passSection.trim()) {
		// パスセクションが見つからない場合、コード全体を使用
		passSection = userCode;
	}
	
	// 移動候補リストを取得
	// window.BOARDSIZEが設定されている場合はそれを使用、なければGameConfig.BoardConfig.BOARDSIZEを使用
	const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : GameConfig.BoardConfig.BOARDSIZE;
	const movablelist = getMovableList(
		copyArray(pos),
		turn,
		select,
		tagged,
		boardsize
	);
	
	// パス候補リストを取得
	const passlist = getPassList(
		copyArray(pos),
		turn,
		select,
		ball
	);
	
	// step変数を取得（game.stepから）
	var step = (typeof window !== 'undefined' && window.game && window.game.step !== undefined) 
		? window.game.step 
		: 0;
	
	// ballとselectをeval内で使用可能にするためvarで宣言
	var ball = ball;
	var select = select;
	
	// 移動評価を実行
	for (let i = 0; i < movablelist.length; i++) {
		// パラメータを取得
		let distance_defense, distance_defense_min, back_forth_from_goalline;
		let horizontal_diff_from_ball, vertical_diff_from_ball;
		let defenseLine, attackLine, deviation_from_uniform_position;
		
		[
			distance_defense,
			distance_defense_min,
			back_forth_from_goalline,
			horizontal_diff_from_ball,
			vertical_diff_from_ball,
			defenseLine,
			attackLine,
			deviation_from_uniform_position,
		] = getParamForMove(pos, ball, movablelist[i][0], movablelist[i][1], select);
		
		// 実行前のeval_listの長さを記録
		const beforeLength = eval_list.length;
		var move_score; // move_score変数を初期化（varを使用してeval内からもアクセス可能にする）
		
		// ユーザーコードの移動セクションを実行
		try {
			// 変数をスコープ内で利用可能にしてユーザーコードを実行
			if (moveSection.trim()) {
				// eval内でmove_scoreに代入できるように、varで宣言したmove_scoreを利用
				eval(moveSection);
			}
		} catch (error) {
			console.error('移動評価コードの実行エラー:', error);
			console.error('エラー詳細:', error.stack);
			// エラーメッセージを表示
			const errorElement = document.getElementById("codeerror");
			console.log('codeerror要素:', errorElement);
			if (errorElement) {
				// 元のコード内での移動セクションの開始行を計算
				const userCodeLines = userCode.split('\n');
				let moveSectionStartLine = 1;
				for (let i = 0; i < userCodeLines.length; i++) {
					if (userCodeLines[i].includes('//移動の評価値計算') || userCodeLines[i].includes('//移動')) {
						moveSectionStartLine = i + 1;
						break;
					}
				}
				// エラースタックから相対行番号を取得を試みる
				const errorLineMatch = error.stack ? error.stack.match(/eval.*:(\d+):(\d+)/) : null;
				if (errorLineMatch) {
					const relativeLine = parseInt(errorLineMatch[1]);
					const absoluteLine = moveSectionStartLine + relativeLine - 1;
					errorElement.innerHTML = `${absoluteLine}行目の${errorLineMatch[2]}文字目でエラーが起こりました。エラー内容：${error.message}`;
				} else {
					errorElement.innerHTML = `移動評価コード（${moveSectionStartLine}行目付近）でエラーが起こりました。エラー内容：${error.message}`;
				}
			}
			// エラー時は評価値を0にする（デフォルト値も追加しない）
			return [[0, 0], []];
		}
		
		// move_score変数が設定されている場合はそれを追加、そうでなければeval_list.push()が呼ばれたかチェック
		if (typeof move_score !== 'undefined' && move_score !== undefined) {
			eval_list.push(move_score);
		} else if (eval_list.length === beforeLength) {
			// ユーザーコードでeval_list.push()もmove_scoreも設定されなかった場合はデフォルト値を追加
			eval_list.push(0.1 * Math.random());
		}
	}
	
	// パス評価を実行
	for (let i = 0; i < passlist.length; i++) {
		// パラメータを取得
		let distance_defense_throw_min, pass_distance, distance_defense_catch_min;
		
		[
			distance_defense_throw_min,
			pass_distance,
			distance_defense_catch_min,
		] = getParamForThrow(pos, ball, i, passlist[i][0], passlist[i][1], select);
		
		// 実行前のeval_listの長さを記録
		const beforeLength = eval_list.length;
		var pass_score; // pass_score変数を初期化（varを使用してeval内からもアクセス可能にする）
		
		// ユーザーコードのパスセクションを実行
		try {
			if (passSection.trim()) {
				// eval内でpass_scoreに代入できるように、varで宣言したpass_scoreを利用
				eval(passSection);
			}
		} catch (error) {
			console.error('パス評価コードの実行エラー:', error);
			console.error('エラー詳細:', error.stack);
			// エラーメッセージを表示
			const errorElement = document.getElementById("codeerror");
			console.log('codeerror要素:', errorElement);
			if (errorElement) {
				// 元のコード内でのパスセクションの開始行を計算
				const userCodeLines = userCode.split('\n');
				let passSectionStartLine = 1;
				for (let i = 0; i < userCodeLines.length; i++) {
					if (userCodeLines[i].includes('//パスの評価値計算') || userCodeLines[i].includes('//パス')) {
						passSectionStartLine = i + 1;
						break;
					}
				}
				// エラースタックから相対行番号を取得を試みる
				const errorLineMatch = error.stack ? error.stack.match(/eval.*:(\d+):(\d+)/) : null;
				if (errorLineMatch) {
					const relativeLine = parseInt(errorLineMatch[1]);
					const absoluteLine = passSectionStartLine + relativeLine - 1;
					errorElement.innerHTML = `${absoluteLine}行目の${errorLineMatch[2]}文字目でエラーが起こりました。エラー内容：${error.message}`;
				} else {
					errorElement.innerHTML = `パス評価コード（${passSectionStartLine}行目付近）でエラーが起こりました。エラー内容：${error.message}`;
				}
			}
			// エラー時は評価値を0にする（デフォルト値も追加しない）
			return [[0, 0], []];
		}
		
		// pass_score変数が設定されている場合はそれを追加、そうでなければeval_list.push()が呼ばれたかチェック
		if (typeof pass_score !== 'undefined' && pass_score !== undefined) {
			eval_list.push(pass_score);
		} else if (eval_list.length === beforeLength) {
			// ユーザーコードでeval_list.push()もpass_scoreも設定されなかった場合はデフォルト値を追加
			eval_list.push(0.1 * Math.random());
		}
	}
	
	// 正常に実行できた場合はエラーメッセージをクリア
	const errorElement = document.getElementById("codeerror");
	if (errorElement) {
		errorElement.innerHTML = "";
	}
	
	// 最善手を返す
	return returnResult(movablelist, passlist, pos, turn, select, ball, eval_list);
}

// AttackAI関数を登録（既存コードとの互換性のため）
// この関数はエディタからコードを実行
rugby_AI.AttackAI = function (pos, turn, select, ball, tagged) {
	var return_arr; // varを使用してeval()内からアクセス可能にする
	if (typeof window.editor !== 'undefined') {
		// 既存コードとの互換性のため、eval()を使用
		// ユーザーが自分でコードを書く環境なので、グローバル変数にアクセスできる必要がある
		try {
			// refreshParam()を呼び出して、必要な変数をグローバルスコープに設定
			if (typeof window.game !== 'undefined' && typeof refreshParam === 'function') {
				refreshParam(window.game);
			}
			
			const userCode = window.editor.getValue();
			
			// 簡潔な形式かどうかを判定（return_arr や let eval_list などのボイラープレートが含まれていないか）
			const isSimplified = !userCode.includes('let eval_list') && !userCode.includes('return_arr = returnResult');
			
			if (isSimplified) {
				// 簡潔な形式：ラッパー関数で実行
				return_arr = executeSimplifiedAI(userCode, pos, turn, select, ball, tagged);
				// 正常に実行できた場合（エラーでない場合）はエラーメッセージをクリア
				// executeSimplifiedAI内でエラーが発生した場合は既にエラーメッセージが設定されている
				if (return_arr && return_arr[0] && return_arr[0][0] !== 0 && return_arr[0][1] !== 0) {
					const errorElement = document.getElementById("codeerror");
					if (errorElement) {
						errorElement.innerHTML = "";
					}
				}
			} else {
				// 従来の形式：そのまま実行
				// movablelistとpasslistをグローバルスコープに設定（AIコードからアクセスできるように）
				// window.BOARDSIZEが設定されている場合はそれを使用、なければGameConfig.BoardConfig.BOARDSIZEを使用
				const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : GameConfig.BoardConfig.BOARDSIZE;
				const movablelist = getMovableList(
					copyArray(pos),
					turn,
					select,
					tagged,
					boardsize
				);
				const passlist = getPassList(
					copyArray(pos),
					turn,
					select,
					ball
				);
				if (typeof window !== 'undefined') {
					window.movablelist = movablelist;
					window.passlist = passlist;
				}
				
				// グローバルスコープで実行するため、eval()を使用
				// eval()は関数のスコープで実行されるため、var return_arr;にアクセス可能
				eval(userCode);
				// 正常に実行できた場合はエラーメッセージをクリア
				const errorElement = document.getElementById("codeerror");
				if (errorElement) {
					errorElement.innerHTML = "";
				}
			}
		} catch (error) {
			console.error('AIコードの実行エラー:', error);
			console.error('エラー詳細:', error.stack);
			// エラーメッセージを表示
			const errorElement = document.getElementById("codeerror");
			console.log('codeerror要素:', errorElement);
			if (errorElement) {
				// エラースタックから行番号を取得を試みる
				const errorLineMatch = error.stack ? error.stack.match(/eval.*:(\d+):(\d+)/) : null;
				if (errorLineMatch) {
					errorElement.innerHTML = `${errorLineMatch[1]}行目の${errorLineMatch[2]}文字目でエラーが起こりました。エラー内容：${error.message}`;
				} else {
					// 行番号が取得できない場合でもエラーメッセージを表示
					errorElement.innerHTML = `AIコードの実行エラー: ${error.message}`;
				}
			} else {
				// エラー要素が取得できない場合のデバッグ
				console.error('codeerror要素が見つかりません');
			}
			if (typeof window.clearError === 'function') {
				window.clearError();
			}
			return [[0, 0], []];
		}
	}
	return return_arr || [[0, 0], []];
};

// グローバル変数を設定（既存コードとの互換性のため）
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
	window.movablelistFunc = (pos, turn, select, tagged) => {
		const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : GameConfig.BoardConfig.BOARDSIZE;
		return getMovableList(pos, turn, select, tagged, boardsize);
	};
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
	window.CheckMateFunc = checkMate; // 既存コードとの互換性のため、グローバルに公開
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
}

/**
 * キャンバスサイズを調整
 */
function canvas_resize() {
	console.log('[canvas_resize] called, window.BOARDSIZE:', window.BOARDSIZE);
	
	// KonvaRendererの場合はコンテナサイズから計算
	if (renderer && renderer instanceof KonvaBoardRenderer) {
		const boards = document.getElementsByClassName('boardarea');
		const container = (boards && boards.length > 0 && boards[0]) || document.getElementById('konva-container');
		if (!container) {
			console.warn('[canvas_resize] container not found');
			return;
		}
		
		const containerWidth = container.clientWidth || BoardConfig.CANVASSIZE;
		const padding = 32;
		const logicalSize = Math.floor(containerWidth - padding);
		const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : BoardConfig.BOARDSIZE;
		const CANVASSIZE = logicalSize - BoardConfig.NUMSIZE;
		const BLOCKSIZE = CANVASSIZE / boardsize;
		const ANALYSISSIZE = 0.5 * BLOCKSIZE;
		
		console.log('[canvas_resize] Konva result:', {
			'BLOCKSIZE': BLOCKSIZE,
			'CANVASSIZE': CANVASSIZE,
			'ANALYSISSIZE': ANALYSISSIZE,
			'window.BOARDSIZE': window.BOARDSIZE
		});
		
		renderer.updateSize(BLOCKSIZE, boardsize, window.NUMSIZE, CANVASSIZE);
		window.BLOCKSIZE = BLOCKSIZE;
		window.CANVASSIZE = CANVASSIZE;
		window.ANALYSISSIZE = ANALYSISSIZE;
		
		console.log('[canvas_resize] after update, window.BLOCKSIZE:', window.BLOCKSIZE, 'window.BOARDSIZE:', window.BOARDSIZE);
		
		// サイズ更新後に描画
		if (renderer && game) {
			renderer.draw(() => refreshParam(game));
		}
	} else {
		// 従来のCanvasRendererの場合
		const result = resizeCanvas(canvas, ctx, null);
		if (result && renderer) {
			console.log('[canvas_resize] result:', {
				'BLOCKSIZE': result.BLOCKSIZE,
				'CANVASSIZE': result.CANVASSIZE,
				'ANALYSISSIZE': result.ANALYSISSIZE,
				'window.BOARDSIZE': window.BOARDSIZE
			});
			renderer.updateSize(result.BLOCKSIZE, window.BOARDSIZE, window.NUMSIZE, result.CANVASSIZE);
			window.BLOCKSIZE = result.BLOCKSIZE;
			window.CANVASSIZE = result.CANVASSIZE;
			window.ANALYSISSIZE = result.ANALYSISSIZE;
			console.log('[canvas_resize] after update, window.BLOCKSIZE:', window.BLOCKSIZE, 'window.BOARDSIZE:', window.BOARDSIZE);
			if (renderer && game) {
				renderer.draw(() => refreshParam(game));
			}
		} else {
			console.warn('[canvas_resize] result or renderer is null');
		}
	}
}

/**
 * マウスの移動
 */
function moveMouse(event) {
	// event.offsetX/Yは既に論理サイズでの座標（CSSでスケールされた後の座標）
	// ただし、高DPI対応でcanvas.width/heightが拡大されている場合、
	// 実際の描画サイズとoffsetWidth/Heightが異なる可能性がある
	const rect = canvas.getBoundingClientRect();
	
	// マウス座標を取得（論理サイズでの座標）
	mouseX = event.clientX - rect.left;
	mouseY = event.clientY - rect.top;
	
	// 論理サイズでのキャンバスサイズ（CANVASSIZE + NUMSIZE）
	const logicalCanvasSize = window.CANVASSIZE + window.NUMSIZE;
	
	// キャンバスの表示サイズ（canvas.offsetWidth/Height）で正規化
	mouseX = (mouseX / canvas.offsetWidth) * logicalCanvasSize;
	mouseY = (mouseY / canvas.offsetHeight) * logicalCanvasSize;
	
	// マス座標に変換（NUMSIZEを引いてからBLOCKSIZEで割る）
	mouseBlockX = Math.floor((mouseX - window.NUMSIZE - 0.5) / window.BLOCKSIZE);
	mouseBlockY = Math.floor((mouseY - window.NUMSIZE - 0.5) / window.BLOCKSIZE);
	
	// 境界チェック（0以上、BOARDSIZE未満）
	if (mouseBlockX < 0) mouseBlockX = 0;
	if (mouseBlockX >= window.BOARDSIZE) mouseBlockX = window.BOARDSIZE - 1;
	if (mouseBlockY < 0) mouseBlockY = 0;
	if (mouseBlockY >= window.BOARDSIZE) mouseBlockY = window.BOARDSIZE - 1;
}

/**
 * ゲーム終了時の処理
 */
function gameOver(result_Diff, x, y) {
	gameEndFlag = 1;
	if (renderer) {
		renderer.drawFinalDisc(x, y);
	}
	if (result_Diff == 1) {
		attack_wins += 1;
		document.getElementById("attack_win_num").innerHTML = "攻め手 " + attack_wins + "回";
	} else if (result_Diff == -1) {
		defense_wins += 1;
		document.getElementById("defense_win_num").innerHTML = "守り手 " + defense_wins + "回";
	}
	const total = attack_wins + defense_wins;
	if (total > 0) {
		document
			.getElementById("attack_win_num")
			.setAttribute("style", "width: " + (attack_wins / total) * 100 + "%");
		document
			.getElementById("defense_win_num")
			.setAttribute("style", "width: " + (defense_wins / total) * 100 + "%");
	}
	setTimeout(() => {
		rematch();
	}, window.ENDDURATION);
}

/**
 * 初期化
 */
function init() {
	canvas = document.getElementById("canvas");
	if (!canvas) return;

	ctx = canvas.getContext("2d");
	if (!ctx) return;

	appState.setCanvas(canvas, ctx);

	gameEndFlag = 0;
	game = new GameController(Role[0], Role[1]);
	
	// KonvaBoardRendererを使用
	renderer = new KonvaBoardRenderer('konva-container', game, appState);
	appState.setRenderer(renderer);
	
	// グローバル変数として直接設定
	if (window.hasOwnProperty('renderer') || Object.getOwnPropertyDescriptor(window, 'renderer')) {
		delete window.renderer;
	}
	window.renderer = renderer;

	// Konva Stageからマウス/タッチイベントを取得
	const konvaStage = renderer.getStage();
	if (konvaStage) {
		let touchStartPos = null;
		
		// マウス移動とタッチ移動の両方に対応
		konvaStage.on('mousemove touchmove', (e) => {
			if (e.evt) {
				e.evt.preventDefault(); // タッチイベントのデフォルト動作を防ぐ
			}
			const blockPos = renderer.getBlockPositionFromEvent(e);
			if (blockPos.x >= 0 && blockPos.y >= 0) {
				mouseBlockX = blockPos.x;
				mouseBlockY = blockPos.y;
			}
		});
		
		// クリックイベント（デスクトップとタッチデバイスの両方で発火）
		konvaStage.on('click', (e) => {
			if (e.evt) {
				e.evt.preventDefault();
			}
			const blockPos = renderer.getBlockPositionFromEvent(e);
			console.log('[konva.onclick]', {
				'AIthinkFlag': AIthinkFlag,
				'mouseBlockX/Y': [blockPos.x, blockPos.y],
				'game.turn': game ? game.turn : 'N/A',
				'game.select': game ? game.select : 'N/A',
				'game.ball': game ? game.ball : 'N/A',
				'game.pos': game ? game.pos : 'N/A'
			});
			if (AIthinkFlag == 0 && blockPos.x >= 0 && blockPos.y >= 0) {
				mouseBlockX = blockPos.x;
				mouseBlockY = blockPos.y;
				console.log('[konva.onclick] calling humanTurn with', [mouseBlockX, mouseBlockY]);
				// 評価値をクリア
				if (renderer instanceof KonvaBoardRenderer) {
					renderer.clearAnalysisValues();
				}
				game.humanTurn(mouseBlockX, mouseBlockY, () => {
					if (renderer) {
						renderer.draw(() => refreshParam(game));
					}
				}, gameOver, appState);
			} else {
				console.warn('[konva.onclick] AI is thinking or invalid position, ignoring click');
			}
		});
		
		// タッチスタート時（タップ検出のため）
		konvaStage.on('touchstart', (e) => {
			if (e.evt) {
				e.evt.preventDefault();
			}
			const blockPos = renderer.getBlockPositionFromEvent(e);
			if (blockPos.x >= 0 && blockPos.y >= 0) {
				touchStartPos = { x: blockPos.x, y: blockPos.y };
				mouseBlockX = blockPos.x;
				mouseBlockY = blockPos.y;
			}
		});
		
		// タッチエンド時（タップとして処理）
		konvaStage.on('touchend', (e) => {
			if (e.evt) {
				e.evt.preventDefault();
			}
			if (touchStartPos) {
				const blockPos = renderer.getBlockPositionFromEvent(e);
				// タッチ開始位置と終了位置が近い場合のみタップとして処理
				if (blockPos.x >= 0 && blockPos.y >= 0 &&
					Math.abs(blockPos.x - touchStartPos.x) <= 1 &&
					Math.abs(blockPos.y - touchStartPos.y) <= 1) {
					console.log('[konva.ontouchend/tap]', {
						'AIthinkFlag': AIthinkFlag,
						'mouseBlockX/Y': [blockPos.x, blockPos.y],
						'game.turn': game ? game.turn : 'N/A',
						'game.select': game ? game.select : 'N/A',
						'game.ball': game ? game.ball : 'N/A',
						'game.pos': game ? game.pos : 'N/A'
					});
					if (AIthinkFlag == 0) {
						mouseBlockX = blockPos.x;
						mouseBlockY = blockPos.y;
						console.log('[konva.ontouchend/tap] calling humanTurn with', [mouseBlockX, mouseBlockY]);
						// 評価値をクリア
						if (renderer instanceof KonvaBoardRenderer) {
							renderer.clearAnalysisValues();
						}
						game.humanTurn(mouseBlockX, mouseBlockY, () => {
							if (renderer) {
								renderer.draw(() => refreshParam(game));
							}
						}, gameOver, appState);
					} else {
						console.warn('[konva.ontouchend/tap] AI is thinking, ignoring tap');
					}
				}
				touchStartPos = null;
			}
		});
	}

	tag = "";
	for (let i = 0; i < window.MAXTAG; i++) {
		tag += GameConfig.TAG_IMG;
	}
	document.getElementById("tag").innerHTML = tag;

	window.addEventListener("resize", canvas_resize, false);
	canvas_resize();

	if (renderer) {
		renderer.draw(() => refreshParam(game));
	}

	if (Role[1] != "human") {
		AIthinkFlag = 1;
		game.AIturn(
			() => {
				if (renderer) {
					renderer.draw(() => refreshParam(game));
				}
			},
			gameOver,
			appState,
			Role
		);
	}
}

/**
 * リマッチ初期化
 */
function rematchInit() {
	console.log('[rematchInit] called, window.BOARDSIZE:', window.BOARDSIZE);
	document.getElementById("result").innerHTML = "";
	AIthinkFlag = 0;
	game.turn = 1;
	game.pos[0] = window.POSDEFENSE.copy();
	game.pos[1] = window.POSATTACK.copy();
	game.select = 0;
	game.ball = 0;
	game.step = 0;
	game.tag = window.MAXTAG;
	tag = "";
	for (let i = 0; i < window.MAXTAG; i++) {
		tag += GameConfig.TAG_IMG;
	}
	document.getElementById("tag").innerHTML = tag;
	console.log('[rematchInit] before renderer.draw, window.BOARDSIZE:', window.BOARDSIZE);
	if (renderer) {
		renderer.draw(() => refreshParam(game));
	}
	console.log('[rematchInit] after renderer.draw, window.BOARDSIZE:', window.BOARDSIZE);
}

/**
 * リマッチ
 */
function rematch() {
	rematchInit();
	if (Role[arrayTurn(game.turn)] != "human") {
		AIthinkFlag = 1;
		game.AIturn(
			() => {
				if (renderer) {
					renderer.draw(() => refreshParam(game));
				}
			},
			gameOver,
			appState,
			Role
		);
	}
}

/**
 * 設定
 */
function config() {
	console.log('[config] called');
	console.log('[config] ConfigForm.boardsize.value:', document.ConfigForm.boardsize.value);
	
	try {
		const newBoardsize = parseInt(document.ConfigForm.boardsize.value);
		console.log('[config] setting BOARDSIZE to:', newBoardsize, 'from', window.BOARDSIZE);
		window.BOARDSIZE = newBoardsize;
		window.attack_num = parseInt(document.ConfigForm.attackNum.value);
		window.defense_num = parseInt(document.ConfigForm.defenseNum.value);
		window.MAXTAG = parseInt(document.ConfigForm.tag_num.value);
		
		console.log('[config] updated values:', {
			'BOARDSIZE': window.BOARDSIZE,
			'attack_num': window.attack_num,
			'defense_num': window.defense_num,
			'MAXTAG': window.MAXTAG
		});
		
		if (typeof pos_editor !== 'undefined') {
			// 既存コードとの互換性のため、eval()を使用
			// ただし、エラーハンドリングを追加
			try {
				eval(pos_editor.getValue());
			} catch (err) {
				document.getElementById("poserror").innerHTML = "初期位置の書き方が正しくありません。" + err;
				return;
			}
		}
	} catch (err) {
		console.error('[config] error:', err);
		document.getElementById("poserror").innerHTML = "初期位置の書き方が正しくありません。" + err;
		return;
	}
	window.CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4];
	window.POSATTACK = window.POSATTACK.slice(0, window.attack_num);
	window.POSDEFENSE = window.POSDEFENSE.slice(0, window.defense_num);
	
	console.log('[config] calling rematchInit first');
	rematchInit();
	console.log('[config] after rematchInit, BOARDSIZE:', window.BOARDSIZE);
	
	console.log('[config] calling canvas_resize after rematchInit');
	// キャンバスサイズを再計算して反映（rematchInitの後に呼ぶ）
	if (typeof canvas_resize === 'function') {
		canvas_resize();
		console.log('[config] after canvas_resize, BOARDSIZE:', window.BOARDSIZE);
	} else {
		console.warn('[config] canvas_resize function not found');
	}
}

/**
 * リスタート
 */
function restart() {
	document.getElementById("attack_win_num").innerHTML = 0;
	document.getElementById("defense_win_num").innerHTML = 0;
	tag = "";
	for (let i = 0; i < window.MAXTAG; i++) {
		tag += GameConfig.TAG_IMG;
	}
	document.getElementById("tag").innerHTML = tag;

	Role[1] = document.ControlForm.attack_role.value;
	Role[0] = document.ControlForm.defense_role.value;
	game.Role[0] = Role[0];
	game.Role[1] = Role[1];

	const game_speed = document.ControlForm.game_speed.value;
	if (game_speed == 0) {
		window.DELAYDURATION = 1500;
		window.ENDDURATION = 1000;
		// アニメーション速度を通常に設定
		if (renderer && renderer.animationManager) {
			renderer.animationManager.setSpeed(1.0);
		}
	} else if (game_speed == 1) {
		window.DELAYDURATION = 100;
		window.ENDDURATION = 1000;
		// アニメーション速度を高速に設定（0.5倍速）
		if (renderer && renderer.animationManager) {
			renderer.animationManager.setSpeed(0.5);
		}
	} else {
		window.DELAYDURATION = 0;
		window.ENDDURATION = 1000;
		// アニメーション速度を超高速に設定（0 = アニメーションなし）
		if (renderer && renderer.animationManager) {
			renderer.animationManager.setSpeed(0);
		}
	}

	if (Role[arrayTurn(game.turn)] != "human" && restartFlag == 0) {
		AIthinkFlag = 1;
		game.AIturn(
			() => {
				if (renderer) {
					renderer.draw(() => refreshParam(game));
				}
			},
			gameOver,
			appState,
			Role
		);
	}

	if (Role[0] != "human" && Role[1] != "human") {
		restartFlag = 1;
	} else {
		restartFlag = 0;
	}
}

/**
 * サンプル設定
 */
function sampleset() {
	const sample_num = parseInt(document.SampleForm.samplenum.value);
	console.log('[sampleset] called, setting BOARDSIZE to:', window.sample[sample_num].boardsize, 'from', window.BOARDSIZE);
	window.BOARDSIZE = window.sample[sample_num].boardsize;
	window.POSATTACK = window.sample[sample_num].attackpos;
	window.POSDEFENSE = window.sample[sample_num].defensepos;
	window.CATCH_PROBABILITY_LIST = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	// サンプルテストのときは残りタグを1に設定
	window.MAXTAG = 1;
	
	console.log('[sampleset] calling rematchInit first');
	rematchInit();
	console.log('[sampleset] after rematchInit, BOARDSIZE:', window.BOARDSIZE);
	
	console.log('[sampleset] calling canvas_resize after rematchInit');
	// キャンバスサイズを再計算して反映（rematchInitの後に呼ぶ）
	if (typeof canvas_resize === 'function') {
		canvas_resize();
		console.log('[sampleset] after canvas_resize, BOARDSIZE:', window.BOARDSIZE);
	} else {
		console.warn('[sampleset] canvas_resize function not found');
	}
}

/**
 * 分析
 */
function analysis() {
	if (typeof clearError === 'function') {
		clearError();
	}
	if (!renderer || !game) return;

	// KonvaRendererの場合はCanvasのクリアをスキップ
	if (renderer instanceof KonvaBoardRenderer) {
		renderer.draw(() => refreshParam(game));
	} else {
		ctx.clearRect(0, 0, window.CANVASSIZE + window.NUMSIZE, window.CANVASSIZE + window.NUMSIZE);
		renderer.draw(() => refreshParam(game));
	}

	let action_list = [];
	const movablelist = getMovableList(
		copyArray(game.pos),
		game.turn,
		game.select,
		game.tagged,
		window.BOARDSIZE
	);
	const passlist = getPassList(
		copyArray(game.pos),
		game.turn,
		game.select,
		game.ball
	);
	action_list = action_list.concat(movablelist);
	action_list = action_list.concat(passlist);

	if (action_list.length == 0) {
		// 評価値がない場合はクリア
		if (renderer instanceof KonvaBoardRenderer) {
			renderer.clearAnalysisValues();
			renderer.draw(() => refreshParam(game));
		}
		return;
	}

	const AI_name = anaRole[arrayTurn(game.turn)];
	const aiFunc = rugby_AI[AI_name];
	if (!aiFunc) {
		// AI関数がない場合はクリア
		if (renderer instanceof KonvaBoardRenderer) {
			renderer.clearAnalysisValues();
			renderer.draw(() => refreshParam(game));
		}
		return;
	}

	const [nextmove, eval_list] = aiFunc(
		game.pos,
		game.turn,
		game.select,
		game.ball,
		game.tagged
	);

	// KonvaRendererの場合は評価値を設定して再描画
	if (renderer instanceof KonvaBoardRenderer) {
		renderer.setAnalysisValues(eval_list, action_list, movablelist);
		renderer.draw(() => refreshParam(game));
	} else {
		// CanvasRendererの場合は従来通りCanvas APIで描画
		ctx.beginPath();
		ctx.font = window.ANALYSISSIZE + "px Osaka";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.globalAlpha = 1;
		ctx.fillStyle = GameConfig.Colors.FONTCOLOR;

		ctx.fillStyle = GameConfig.Colors.ANAMOVEFONTCOLOR;
		for (let i = 0; i < movablelist.length; i++) {
			ctx.fillText(
				Math.floor(eval_list[i]),
				action_list[i][0] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5,
				action_list[i][1] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5
			);
		}
		ctx.fillStyle = GameConfig.Colors.ANAPASSFONTCOLOR;
		for (let i = movablelist.length; i < movablelist.length + passlist.length; i++) {
			ctx.fillText(
				Math.floor(eval_list[i]),
				action_list[i][0] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5,
				action_list[i][1] * window.BLOCKSIZE + ~~(window.BLOCKSIZE * 0.5) + window.NUMSIZE + 0.5
			);
		}
	}
}

/**
 * エラーをクリア
 */
function clearError() {
	document.getElementById("codeerror").innerHTML = "";
	document.getElementById("poserror").innerHTML = "";
	if (typeof window.editor !== 'undefined' && window.editor.doc) {
		window.editor.doc.getAllMarks().forEach((marker) => marker.clear());
	}
}

/**
 * AI設定
 */
function setAI() {
	if (typeof window.editor !== 'undefined') {
		// 既存コードとの互換性のため、eval()を使用
		try {
			eval(window.editor.getValue());
		} catch (err) {
			console.error('AIコードの設定エラー:', err);
			if (typeof clearError === 'function') {
				clearError();
			}
		}
	}
}

/**
 * エラーハンドラー
 */
window.onerror = function (message, fileName, lineNumber, columnNumber, error) {
	document.getElementById("codeerror").innerHTML =
		lineNumber +
		"行目の" +
		columnNumber +
		"文字目でエラーが起こりました。エラー内容：" +
		message;
	if (typeof window.editor !== 'undefined') {
		const doc = window.editor.getDoc();
		const options = {
			css: "background-color:#ffcfcc", // styleを直接指定する場合
		};

		const marker = doc.markText(
			{ line: lineNumber - 1, ch: 0 },
			{ line: lineNumber - 1, ch: 1000 },
			options
		);
	}

	return true;
};

/**
 * 保存
 */
function save() {
	if (typeof window.editor === 'undefined') return;
	const txt = window.editor.getValue();
	const blob = new Blob([txt], { type: "text/plain" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "AI.txt";
	a.click();
}

// グローバルに公開（既存コードとの互換性のため）
if (typeof window !== 'undefined') {
	window.init = init;
	window.rematch = rematch;
	window.rematchInit = rematchInit;
	window.config = config;
	window.restart = restart;
	window.sampleset = sampleset;
	window.analysis = analysis;
	window.gameOver = gameOver;
	window.moveMouse = moveMouse;
	window.canvas_resize = canvas_resize;
	window.clearError = clearError;
	window.save = save;
	window.setAI = setAI;

	// グローバル変数も公開
	window.Role = Role;
	window.anaRole = anaRole;
	window.attack_wins = attack_wins;
	window.defense_wins = defense_wins;
	window.gameEndFlag = gameEndFlag;
	window.AIthinkFlag = AIthinkFlag;
	window.restartFlag = restartFlag;
	window.mouseX = mouseX;
	window.mouseY = mouseY;
	window.mouseBlockX = mouseBlockX;
	window.mouseBlockY = mouseBlockY;
	
	// game変数をグローバルに公開（AIコードからアクセスできるように）
	// 注意: gameはinit()で初期化されるため、ここでは参照のみ
	Object.defineProperty(window, 'game', {
		get: function() { return game; },
		set: function(value) { game = value; },
		enumerable: true,
		configurable: true
	});
	
	// renderer変数はinit()内で直接設定される（Object.definePropertyは使用しない）
}

// window.onload時に初期化
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', function() {
		init();
	});
} else {
	init();
}

window.onload = function() {
	if (!window.renderer) {
		init();
	}
};

// エクスポート
export {
	init,
	rematch,
	rematchInit,
	config,
	restart,
	sampleset,
	analysis,
	gameOver,
	moveMouse,
	canvas_resize,
	clearError,
	save,
	GameController,
	CanvasRenderer,
	refreshParam,
};

