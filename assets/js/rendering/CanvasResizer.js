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
	const boardarea = document.getElementsByClassName("boardarea");
	if (!canvas || !canvas.getContext) {
		return null;
	}

	canvas.setAttribute("width", boardarea[0].clientWidth * 0.8);
	canvas.setAttribute("height", boardarea[0].clientWidth * 0.8);

	const CANVASSIZE = canvas.clientWidth - BoardConfig.NUMSIZE - 1;
	const BLOCKSIZE = CANVASSIZE / BoardConfig.BOARDSIZE;
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

