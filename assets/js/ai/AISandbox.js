/* --------------------------------------------------------------------------
 * AI Sandbox
 * AIコードの安全な実行環境
 * eval()の代わりにFunctionコンストラクタを使用
 * -------------------------------------------------------------------------- */

/**
 * AIコードを安全に実行
 * @param {string} code - 実行するJavaScriptコード
 * @returns {Function} 実行可能な関数
 */
export function createAIFunction(code) {
	try {
		// Functionコンストラクタを使用（evalより安全だが、完全には安全ではない）
		// 将来的には、より安全なサンドボックス環境（Web Worker等）を検討
		return new Function(code);
	} catch (error) {
		console.error('AIコードの実行に失敗しました:', error);
		throw error;
	}
}

/**
 * AIコードを実行して結果を取得
 * @param {string} code - 実行するJavaScriptコード
 * @param {Object} context - 実行コンテキスト（グローバル変数など）
 * @returns {*} 実行結果
 */
export function executeAICode(code, context = {}) {
	try {
		const func = createAIFunction(code);
		// コンテキストを関数内で使用可能にする
		return func.call(context);
	} catch (error) {
		console.error('AIコードの実行中にエラーが発生しました:', error);
		throw error;
	}
}

