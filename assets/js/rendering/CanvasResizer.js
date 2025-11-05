/* --------------------------------------------------------------------------
 * Canvas Resizer
 * キャンバスサイズの調整を管理
 * -------------------------------------------------------------------------- */

import { BoardConfig } from '../config/GameConfig.js';

/**
 * キャンバスサイズを調整
 * @param {HTMLCanvasElement} canvas - キャンバス要素
 * @param {CanvasRenderingContext2D} ctx - コンテキスト
 * @param {Function} drawFunc - 描画関数
 * @returns {Object} {canvas, ctx, CANVASSIZE, BLOCKSIZE, ANALYSISSIZE}
 */
export function resizeCanvas(canvas, ctx, drawFunc) {
	const boards = document.getElementsByClassName('boardarea');

	if (!canvas || !canvas.getContext) {
		return null;
	}

	const container =
		(boards && boards.length > 0 && boards[0]) || canvas.parentElement || canvas;
	const containerWidth = container.clientWidth || BoardConfig.CANVASSIZE;
	
	// 横幅いっぱいを使用（パディングを考慮）
	const padding = 32; // 1rem = 16px × 2（左右）
	const logicalSize = Math.floor(containerWidth - padding);
	
	// 高DPI対応: devicePixelRatioを考慮
	const dpr = window.devicePixelRatio || 1;
	
	// 実際のピクセルサイズ（高DPI対応）
	const pixelSize = Math.floor(logicalSize * dpr);

	// キャンバスの実際のピクセルサイズを設定
	canvas.width = pixelSize;
	canvas.height = pixelSize;

	// 表示サイズを論理サイズに設定（CSSで調整される）
	canvas.style.width = logicalSize + 'px';
	canvas.style.height = logicalSize + 'px';

	// コンテキストをリセットしてからスケール（累積を防ぐ）
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.scale(dpr, dpr);

	// 論理サイズで計算
	// window.BOARDSIZEが設定されている場合はそれを使用、なければBoardConfig.BOARDSIZEを使用
	const boardsize = (typeof window !== 'undefined' && window.BOARDSIZE) ? window.BOARDSIZE : BoardConfig.BOARDSIZE;
	// CANVASSIZEはNUMSIZEを除いた描画領域のサイズ
	// 最後のマスまで描画できるように、-1を削除（境界線の0.5ピクセル分は考慮済み）
	const CANVASSIZE = logicalSize - BoardConfig.NUMSIZE;
	const BLOCKSIZE = CANVASSIZE / boardsize;
	const ANALYSISSIZE = 0.5 * BLOCKSIZE;

	if (drawFunc) {
		drawFunc(ctx, canvas);
	}

	return {
		canvas,
		ctx,
		CANVASSIZE,
		BLOCKSIZE,
		ANALYSISSIZE
	};
}

