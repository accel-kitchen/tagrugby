/* --------------------------------------------------------------------------
 * Array Utility Functions
 * 配列操作のユーティリティ関数
 * -------------------------------------------------------------------------- */

/**
 * 配列のディープコピーを作成
 * @param {Array} arr - コピーする配列
 * @returns {Array} コピーされた配列
 */
export function copyArray(arr) {
	const obj = [];
	for (let i = 0, len = arr.length; i < len; i++) {
		if (arr[i] && Array.isArray(arr[i]) && arr[i].length > 0) {
			obj[i] = copyArray(arr[i]);
		} else {
			obj[i] = arr[i];
		}
	}
	return obj;
}

/**
 * 二次元配列をソート
 * @param {Array} arrs - ソートする二次元配列
 * @param {number} col - 並べ替えの対象となる列
 * @param {number} order - 1=昇順、-1=降順
 * @returns {Array} ソートされた配列
 */
export function xsort(arrs, col, order) {
	arrs.sort(function (a, b) {
		return (a[col] - b[col]) * order;
	});
	return arrs;
}

/**
 * 配列を転置
 * @param {Array} a - 転置する配列
 * @returns {Array} 転置された配列
 */
export const transpose = (a) => a[0].map((_, c) => a.map((r) => r[c]));

/**
 * 配列の各要素にインデックスを追加
 * @param {Array} arr - インデックスを追加する配列
 * @returns {Array} インデックスが追加された配列
 */
export function addIndex(arr) {
	for (let i = 0; i < arr.length; i++) {
		arr[i].push(i);
	}
	return arr;
}

/**
 * 数値配列をソート
 * @param {Array} arr - ソートする配列
 * @returns {Array} ソートされた配列
 */
export function sortNum(arr) {
	function bcmp(v1, v2) {
		return arr[v1] - arr[v2];
	}
	return arr.sort(bcmp);
}

