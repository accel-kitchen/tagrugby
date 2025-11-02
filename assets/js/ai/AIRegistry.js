/* --------------------------------------------------------------------------
 * AI Registry
 * AI関数の登録と管理
 * -------------------------------------------------------------------------- */

/**
 * AI関数のレジストリ
 * AI関数は pos, turn, select, ball, tagged を引数として
 * [[x, y], eval_list] を返す必要がある
 */
export const rugby_AI = {};

/**
 * AI関数を登録
 * @param {string} name - AI名
 * @param {Function} aiFunc - AI関数
 */
export function registerAI(name, aiFunc) {
	rugby_AI[name] = aiFunc;
}

/**
 * AI関数を取得
 * @param {string} name - AI名
 * @returns {Function|null} AI関数、存在しない場合はnull
 */
export function getAI(name) {
	return rugby_AI[name] || null;
}

