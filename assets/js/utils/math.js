/* --------------------------------------------------------------------------
 * Math Utility Functions
 * 数学関連のユーティリティ関数
 * -------------------------------------------------------------------------- */

/**
 * 2点間の距離を計算
 * @param {number} a - x方向の距離
 * @param {number} b - y方向の距離
 * @returns {number} 距離
 */
export function distance(a, b) {
	return Math.sqrt(a * a + b * b);
}

/**
 * 配列の合計値を計算
 * @param {number[]} arr - 数値配列
 * @returns {number} 合計値
 */
export function sum(arr) {
	return arr.reduce(function (prev, current) {
		return prev + current;
	}, 0);
}

/**
 * パスがキャッチできる確率を計算
 * @param {number} x1 - 送り手のx座標
 * @param {number} y1 - 送り手のy座標
 * @param {number} x2 - 受け手のx座標
 * @param {number} y2 - 受け手のy座標
 * @param {number[]} catchProbabilityList - 距離ごとの成功率リスト
 * @returns {number} キャッチ確率
 */
export function catchProb(x1, y1, x2, y2, catchProbabilityList) {
	// 6×6の盤面の場合は常に100%の成功率
	if (typeof window !== 'undefined' && window.BOARDSIZE === 6) {
		return 1;
	}
	const dis = Math.round(distance(x2 - x1, y2 - y1));
	if (dis > catchProbabilityList.length - 1) {
		return 0;
	}
	return catchProbabilityList[dis];
}

/**
 * 確率に基づいて成功/失敗を判定
 * @param {number} prob - 確率 (0-1)
 * @returns {number} 1=成功, 0=失敗
 */
export function probJudge(prob) {
	if (Math.random() < prob) {
		return 1;
	} else {
		return 0;
	}
}

