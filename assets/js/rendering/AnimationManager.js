/* --------------------------------------------------------------------------
 * Animation Manager
 * ゲームアクション（移動・パス・タグ）のアニメーションを管理
 * -------------------------------------------------------------------------- */

/**
 * イージング関数
 */
export const EasingFunctions = {
	// 線形
	linear(t) {
		return t;
	},
	// ease-in-out
	easeInOut(t) {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	},
	// ease-out
	easeOut(t) {
		return t * (2 - t);
	},
	// ease-in
	easeIn(t) {
		return t * t;
	},
	// バウンス
	bounce(t) {
		if (t < 1 / 2.75) {
			return 7.5625 * t * t;
		} else if (t < 2 / 2.75) {
			return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
		} else if (t < 2.5 / 2.75) {
			return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
		} else {
			return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
		}
	},
};

/**
 * アニメーションタイプ
 */
export const AnimationType = {
	MOVE: 'move',
	PASS: 'pass',
	TAG: 'tag',
	FEEDBACK: 'feedback', // フィードバック表示（タグ取得・パス成功/失敗）
};

/**
 * アニメーションマネージャークラス
 */
export class AnimationManager {
	constructor() {
		this.animations = new Map();
		this.animationId = null;
		this.isRunning = false;
		this.speedMultiplier = 1.0; // アニメーション速度倍率（1.0 = 通常、0.5 = 高速、0 = 超高速）
	}

	/**
	 * アニメーション速度を設定
	 * @param {number} speed - 速度倍率（1.0 = 通常、0.5 = 高速、0 = 超高速）
	 */
	setSpeed(speed) {
		this.speedMultiplier = speed;
	}

	/**
	 * 移動アニメーションを開始
	 * @param {number} team - チーム (0=ディフェンス, 1=アタック)
	 * @param {number} playerIndex - プレイヤーインデックス
	 * @param {number} fromX - 開始X座標
	 * @param {number} fromY - 開始Y座標
	 * @param {number} toX - 終了X座標
	 * @param {number} toY - 終了Y座標
	 * @param {Function} onComplete - 完了コールバック
	 * @param {number} duration - アニメーション時間（ms）
	 * @returns {string} アニメーションID
	 */
	startMoveAnimation(team, playerIndex, fromX, fromY, toX, toY, onComplete, duration = 350) {
		// 速度倍率を適用
		duration = duration * this.speedMultiplier;
		if (duration <= 0) {
			// 超高速（duration = 0）の場合は即座に完了
			if (onComplete) onComplete();
			return null;
		}
		const id = `${AnimationType.MOVE}_${team}_${playerIndex}_${Date.now()}`;
		this.animations.set(id, {
			type: AnimationType.MOVE,
			team,
			playerIndex,
			fromX,
			fromY,
			toX,
			toY,
			startTime: performance.now(),
			duration,
			onComplete,
			easing: EasingFunctions.easeInOut,
		});
		this.startAnimationLoop();
		return id;
	}

	/**
	 * パスアニメーションを開始
	 * @param {number} fromX - 送り手のX座標
	 * @param {number} fromY - 送り手のY座標
	 * @param {number} toX - 受け手のX座標
	 * @param {number} toY - 受け手のY座標
	 * @param {Function} onComplete - 完了コールバック
	 * @param {number} duration - アニメーション時間（ms）
	 * @returns {string} アニメーションID
	 */
	startPassAnimation(fromX, fromY, toX, toY, onComplete, duration = 450) {
		// 速度倍率を適用
		duration = duration * this.speedMultiplier;
		if (duration <= 0) {
			// 超高速（duration = 0）の場合は即座に完了
			if (onComplete) onComplete();
			return null;
		}
		const id = `${AnimationType.PASS}_${Date.now()}`;
		// 放物線の高さを計算（距離に応じて）
		const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
		const peakHeight = Math.min(distance * 0.3, 3); // 最大3マス分の高さ
		
		this.animations.set(id, {
			type: AnimationType.PASS,
			fromX,
			fromY,
			toX,
			toY,
			peakHeight,
			startTime: performance.now(),
			duration,
			onComplete,
			easing: EasingFunctions.easeOut,
		});
		this.startAnimationLoop();
		return id;
	}

	/**
	 * タグアニメーションを開始
	 * @param {number} x - タグ発生位置のX座標
	 * @param {number} y - タグ発生位置のY座標
	 * @param {Function} onComplete - 完了コールバック
	 * @param {number} duration - アニメーション時間（ms）
	 * @returns {string} アニメーションID
	 */
	startTagAnimation(x, y, onComplete, duration = 300) {
		// 速度倍率を適用
		duration = duration * this.speedMultiplier;
		if (duration <= 0) {
			// 超高速（duration = 0）の場合は即座に完了
			if (onComplete) onComplete();
			return null;
		}
		const id = `${AnimationType.TAG}_${Date.now()}`;
		this.animations.set(id, {
			type: AnimationType.TAG,
			x,
			y,
			startTime: performance.now(),
			duration,
			onComplete,
			easing: EasingFunctions.bounce,
		});
		this.startAnimationLoop();
		return id;
	}

	/**
	 * アニメーションループを開始
	 */
	startAnimationLoop() {
		if (this.isRunning) {
			return;
		}
		this.isRunning = true;
		this.animationId = requestAnimationFrame(() => this.animate());
	}

	/**
	 * アニメーションループ
	 */
	animate() {
		const currentTime = performance.now();
		const activeAnimations = [];

		for (const [id, animation] of this.animations.entries()) {
			const elapsed = currentTime - animation.startTime;
			const progress = Math.min(elapsed / animation.duration, 1);
			const easedProgress = animation.easing(progress);

			// アニメーションが完了したかチェック
			if (progress >= 1) {
				if (animation.onComplete) {
					animation.onComplete();
				}
				this.animations.delete(id);
			} else {
				activeAnimations.push({ id, animation, easedProgress });
			}
		}

		// アクティブなアニメーションがある場合はループを継続
		if (this.animations.size > 0) {
			this.animationId = requestAnimationFrame(() => this.animate());
		} else {
			this.isRunning = false;
			this.animationId = null;
		}
	}

	/**
	 * 移動アニメーションの現在位置を取得
	 * @param {number} team - チーム
	 * @param {number} playerIndex - プレイヤーインデックス
	 * @returns {Object|null} {x, y} または null
	 */
	getMovePosition(team, playerIndex) {
		for (const [id, animation] of this.animations.entries()) {
			if (
				animation.type === AnimationType.MOVE &&
				animation.team === team &&
				animation.playerIndex === playerIndex
			) {
				const elapsed = performance.now() - animation.startTime;
				const progress = Math.min(elapsed / animation.duration, 1);
				const easedProgress = animation.easing(progress);
				
				return {
					x: animation.fromX + (animation.toX - animation.fromX) * easedProgress,
					y: animation.fromY + (animation.toY - animation.fromY) * easedProgress,
				};
			}
		}
		return null;
	}

	/**
	 * パスアニメーションの現在位置を取得
	 * @returns {Object|null} {x, y, z} または null（zは高さ）
	 */
	getPassPosition() {
		for (const [id, animation] of this.animations.entries()) {
			if (animation.type === AnimationType.PASS) {
				const elapsed = performance.now() - animation.startTime;
				const progress = Math.min(elapsed / animation.duration, 1);
				const easedProgress = animation.easing(progress);
				
				// 放物線の計算
				const x = animation.fromX + (animation.toX - animation.fromX) * easedProgress;
				const y = animation.fromY + (animation.toY - animation.fromY) * easedProgress;
				// zは放物線の高さ（0からpeakHeightへ、その後0へ）
				const z = animation.peakHeight * 4 * easedProgress * (1 - easedProgress);
				
				return { x, y, z };
			}
		}
		return null;
	}

	/**
	 * タグアニメーションのスケールを取得
	 * @returns {number|null} スケール値（1.0-1.5程度）または null
	 */
	getTagScale() {
		for (const [id, animation] of this.animations.entries()) {
			if (animation.type === AnimationType.TAG) {
				const elapsed = performance.now() - animation.startTime;
				const progress = Math.min(elapsed / animation.duration, 1);
				const easedProgress = animation.easing(progress);
				
				// パルス効果：1.0 → 1.5 → 1.0
				if (progress < 0.5) {
					return 1.0 + easedProgress * 0.5;
				} else {
					return 1.5 - (easedProgress - 0.5) * 0.5;
				}
			}
		}
		return null;
	}

	/**
	 * タグアニメーションの位置を取得
	 * @returns {Object|null} {x, y} または null
	 */
	getTagPosition() {
		for (const [id, animation] of this.animations.entries()) {
			if (animation.type === AnimationType.TAG) {
				return { x: animation.x, y: animation.y };
			}
		}
		return null;
	}

	/**
	 * フィードバックエフェクトを開始（タグ取得・パス成功/失敗）
	 * @param {number} x - 表示位置のX座標
	 * @param {number} y - 表示位置のY座標
	 * @param {string} text - 表示テキスト
	 * @param {string} color - テキストの色（デフォルト: "#FF0000"）
	 * @param {number} duration - アニメーション時間（ms、デフォルト2000ms = 1秒停止 + 1秒フェードアウト）
	 */
	startFeedbackEffect(x, y, text, color = "#FF0000", duration = 2000) {
		// 速度倍率を適用
		duration = duration * this.speedMultiplier;
		if (duration <= 0) {
			// 超高速（duration = 0）の場合は即座に完了（表示しない）
			return null;
		}
		const id = `${AnimationType.FEEDBACK}_${Date.now()}`;
		this.animations.set(id, {
			type: AnimationType.FEEDBACK,
			x,
			y,
			text,
			color,
			startTime: performance.now(),
			duration,
			easing: EasingFunctions.easeOut,
		});
		this.startAnimationLoop();
		return id;
	}

	/**
	 * フィードバックエフェクトの情報を取得
	 * @returns {Array} フィードバックエフェクトの配列 [{x, y, text, color, progress, opacity}]
	 */
	getFeedbackEffects() {
		const effects = [];
		const currentTime = performance.now();
		
		for (const [id, animation] of this.animations.entries()) {
			if (animation.type === AnimationType.FEEDBACK) {
				const elapsed = currentTime - animation.startTime;
				const progress = Math.min(elapsed / animation.duration, 1);
				
				// 最初の50%（1秒間）は完全表示、その後50%（1秒間）でフェードアウト
				let opacity = 1;
				if (progress > 0.5) {
					// 後半50%でフェードアウト（0.5から1.0の間で1から0へ）
					const fadeProgress = (progress - 0.5) / 0.5; // 0.0から1.0へ
					opacity = 1 - fadeProgress;
				}
				
				// 上方向に移動（フェードアウト開始時から移動開始）
				let offsetY = 0;
				if (progress > 0.5) {
					const moveProgress = (progress - 0.5) / 0.5; // 0.0から1.0へ
					const easedMoveProgress = EasingFunctions.easeOut(moveProgress);
					offsetY = -20 * easedMoveProgress; // 最大20px上に移動
				}
				
				effects.push({
					x: animation.x,
					y: animation.y + offsetY,
					text: animation.text,
					color: animation.color,
					progress,
					opacity,
				});
			}
		}
		return effects;
	}

	/**
	 * アクティブなアニメーションがあるかチェック
	 * @returns {boolean}
	 */
	hasActiveAnimations() {
		return this.animations.size > 0;
	}

	/**
	 * すべてのアニメーションをクリア
	 */
	clearAll() {
		this.animations.clear();
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		this.isRunning = false;
	}
}

