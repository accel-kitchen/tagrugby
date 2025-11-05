
const inputField = document.getElementById("input-field");
const chatBox = document.getElementById("chat-box");
const loadingIndicator = document.getElementById("loadingIndicator");

// 会話履歴を保持する配列
const conversationHistory = [];

// チャットボックスの高さを調整
function adjustChatBoxHeight() {
	if (chatBox.children.length === 0) {
		chatBox.style.minHeight = '0';
	} else {
		// コンテンツの高さに応じて調整（最大840pxまで）
		const scrollHeight = chatBox.scrollHeight;
		chatBox.style.minHeight = Math.min(scrollHeight, 840) + 'px';
	}
}

function createMessageElement(role, text) {
	const entry = document.createElement("div");
	entry.className = `chat-entry chat-${role.toLowerCase()}`;
	const label = document.createElement("strong");
	label.textContent = `${role}:`;
	entry.appendChild(label);
	const body = document.createElement("div");
	body.className = "chat-text";
	body.style.whiteSpace = "pre-wrap";
	
	// コードブロックを検出してスタイリング
	const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/gi;
	const matches = [];
	let match;
	
	// すべてのマッチを収集（グローバルフラグのため配列に保存）
	while ((match = codeBlockRegex.exec(text)) !== null) {
		matches.push({
			index: match.index,
			length: match[0].length,
			content: match[1].trim()
		});
	}
	
	if (matches.length > 0) {
		let lastIndex = 0;
		matches.forEach((codeMatch) => {
			// コードブロックの前のテキストを追加
			if (codeMatch.index > lastIndex) {
				const textBefore = document.createTextNode(text.slice(lastIndex, codeMatch.index));
				body.appendChild(textBefore);
			}
			
			// コードブロックをCodeMirrorエディタで表示
			const codeBlock = document.createElement("div");
			codeBlock.className = "chat-code-block";
			
			// テキストエリアを作成してCodeMirrorを初期化
			const textarea = document.createElement("textarea");
			textarea.value = codeMatch.content;
			codeBlock.appendChild(textarea);
			
			// CodeMirrorエディタを作成（読み取り専用）
			const codeEditor = CodeMirror.fromTextArea(textarea, {
				mode: "javascript",
				theme: "eclipse",
				lineNumbers: true,
				readOnly: true,
				lineWrapping: true,
				viewportMargin: Infinity,
			});
			
			// CodeMirrorのサイズを調整（高さは自動調整）
			codeEditor.setSize("100%", null);
			
			// コンテンツの高さに合わせて調整
			setTimeout(() => {
				codeEditor.refresh();
				// CodeMirrorの実際のコンテンツ高さを取得
				const scrollerElement = codeEditor.getScrollerElement();
				const contentHeight = scrollerElement.scrollHeight;
				// パディング用に30px追加、最大600px
				const finalHeight = Math.min(contentHeight + 30, 600);
				codeEditor.setSize("100%", finalHeight);
			}, 100);
			
			body.appendChild(codeBlock);
			
			lastIndex = codeMatch.index + codeMatch.length;
		});
		
		// 残りのテキストを追加
		if (lastIndex < text.length) {
			const textAfter = document.createTextNode(text.slice(lastIndex));
			body.appendChild(textAfter);
		}
	} else {
		// コードブロックが見つからなかった場合は元のテキストをそのまま表示
		body.textContent = ` ${text}`;
	}
	
	entry.appendChild(body);
	return entry;
}

function appendUserMessage(message) {
	const entry = createMessageElement("You", message);
	chatBox.appendChild(entry);
	adjustChatBoxHeight();
	chatBox.scrollTop = chatBox.scrollHeight;
	// 会話履歴に追加
	conversationHistory.push({ role: "user", content: message });
}

function appendSystemMessage(message) {
	const entry = createMessageElement("System", message);
	entry.classList.add("text-secondary");
	chatBox.appendChild(entry);
	adjustChatBoxHeight();
	chatBox.scrollTop = chatBox.scrollHeight;
}

function applyCodeToEditor(code) {
	const editorInstance = window.attackEditor || window.editor;
	const textarea = document.CodingForm2 && document.CodingForm2.attackAIfunc;
	
	// CodeMirrorエディタに反映
	if (editorInstance && typeof editorInstance.setValue === "function") {
		editorInstance.setValue(code);
		editorInstance.focus();
	}
	
	// フォーム上のテキストエリアにも確実に反映
	if (textarea) {
		textarea.value = code;
	}
	
	return !!(editorInstance || textarea);
}

function appendAIMessage(reply) {
	const entry = createMessageElement("AI", reply);
	chatBox.appendChild(entry);
	// 会話履歴に追加
	conversationHistory.push({ role: "assistant", content: reply });
	
	const codeSnippet = extractFirstCodeBlock(reply);
	if (codeSnippet) {
		const actions = document.createElement("div");
		actions.className = "chat-actions mt-2";
		const applyButton = document.createElement("button");
		applyButton.type = "button";
		applyButton.className = "btn btn-outline-primary btn-sm";
		applyButton.textContent = "提案コードをエディタに反映";
		applyButton.addEventListener("click", () => {
			const applied = applyCodeToEditor(codeSnippet);
			if (applied) {
				applyButton.disabled = true;
				applyButton.textContent = "エディタに反映済み";
				appendSystemMessage("AIの提案をエディタに反映しました。");
			} else {
				appendSystemMessage("エディタを取得できませんでした。画面を再読み込みしてください。");
			}
		});
		actions.appendChild(applyButton);
		entry.appendChild(actions);
	}
	// CodeMirrorの初期化後に高さを調整（少し遅延させて確実に）
	setTimeout(() => {
		adjustChatBoxHeight();
		chatBox.scrollTop = chatBox.scrollHeight;
	}, 150);
}

function extractFirstCodeBlock(text) {
	const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/i;
	const match = codeBlockRegex.exec(text);
	if (match && match[1]) {
		return match[1].trim();
	}
	return "";
}

function fetchFileSync(path) {
	const request = new XMLHttpRequest();
	try {
		request.open("GET", path, false);
		request.send(null);
		if (request.status >= 200 && request.status < 300) {
			return request.responseText;
		}
	} catch (error) {
		console.warn("Failed to load", path, error);
	}
	return "";
}

function extractSection(code, startPattern, endPattern) {
	const startIndex = code.search(startPattern);
	if (startIndex === -1) {
		return "";
	}
	const fromStart = code.slice(startIndex);
	if (!endPattern) {
		return fromStart;
	}
	const endIndex = fromStart.search(endPattern);
	if (endIndex === -1) {
		return fromStart;
	}
	return fromStart.slice(0, endIndex);
}

function buildAttackContext(message) {
	const normalized = message.normalize("NFKC").toLowerCase();
	const aiMatch = normalized.match(/ai\s*[-_#]?(\d{1,2})/);
	let baseCode = "";

	// エディタで編集中の攻め手AIのコードを最優先で取得
	const editorInstance = window.attackEditor || window.editor;
	if (editorInstance && typeof editorInstance.getValue === "function") {
		baseCode = editorInstance.getValue().trim();
		console.log("CodeMirrorエディタからコードを取得しました:", baseCode.length, "文字");
	} else {
		const textarea = document.CodingForm2 && document.CodingForm2.attackAIfunc;
		if (textarea && textarea.value) {
			baseCode = textarea.value.trim();
			console.log("テキストエリアからコードを取得しました:", baseCode.length, "文字");
		}
	}

	// メッセージにAI#が明示的に指定されている場合のみ、そのファイルを参照
	if (!baseCode && aiMatch) {
		baseCode = fetchFileSync(`AI/AI${aiMatch[1]}.js`) || "";
	}

	// エディタが空で、AI#も指定されていない場合は、デフォルトのattackAI.jsを参照
	if (!baseCode && typeof loadAI === "function") {
		baseCode = loadAI() || "";
	}

	if (!baseCode) {
		return "";
	}

	// パラメータドキュメントを生成
	const parameterDoc = `// ============================================
// 使用可能なパラメータ一覧
// ============================================
//
// 【共通で使用可能な変数】
//
// - step: 現在のステップ数（行動回数）
//   例: step < 5 で最初の5手を判定
//
// - ball: ボールを持っているプレイヤーの番号（0から始まる）
//   例: ball === select で自分がボールを持っているか判定
//
// - select: 現在行動するプレイヤーの番号（0から始まる）
//   例: select === 0 で1人目のプレイヤーか判定
//
// 【移動評価で使用可能なパラメータ】
//
// - distance_defense: 守り手までの距離（配列）
//   各守り手との距離が配列で格納されている
//
// - distance_defense_min: 守り手までの最小距離
//   最も近い守り手との距離。値が大きいほど安全
//
// - back_forth_from_goalline: ゴールラインに対する前後の移動距離
//   前進すると正の値、後退すると負の値、横移動は0
//   例: 後退を重視する場合、-15 * back_forth_from_goalline など
//
// - horizontal_diff_from_ball: ボールを持っているプレイヤーとの横方向の距離（絶対値）
//   ボールとの横の距離が大きいほど値が大きくなる
//
// - vertical_diff_from_ball: ボールを持っているプレイヤーとの縦方向の距離
//   正の値はボールより前方、負の値はボールより後方
//
// - defenseLine: 守り手の左からの順番を表した配列
//   左から右に向かって守り手のIDが格納されている
//
// - attackLine: 攻め手の左からの順番を表した配列
//   左から右に向かって攻め手のIDが格納されている
//
// - deviation_from_uniform_position: 均等に横方向に並ぶ場合の場所からのずれ
//   均等に並ぶことを重視する場合に使用。値が小さいほど均等に近い
//
// 【パス評価で使用可能なパラメータ】
//
// - distance_defense_throw_min: ボールを持っているプレイヤーとディフェンスとの最短距離
//   パスする側が守り手から離れているほど安全。値が大きいほど良い
//
// - pass_distance: パスの距離（ユークリッド距離）
//   パス距離が短いほど成功率が高い。値が小さいほど良い
//
// - distance_defense_catch_min: パスを受けるプレイヤーとディフェンスとの最短距離
//   パスを受ける側が守り手から離れているほど安全。値が大きいほど良い
//
// 【コード形式】
//
// このコードは簡潔な形式で記述します：
//
// 1. 移動評価セクション:
//    move_score = 評価値;
//    ※ eval_list.push() は不要（自動的に追加されます）
//
// 2. パス評価セクション:
//    pass_score = 評価値;
//    ※ eval_list.push() は不要（自動的に追加されます）
//
// 3. 評価値が設定されない場合:
//    自動的に 0.1 * Math.random() が追加されます
//
// 【重要：コード記述の原則】
//
// - 新しい変数（let, const, var）を定義しないでください
// - 既存のパラメータ変数（step, ball, select, distance_defense_min など）を直接使用してください
// - できるだけシンプルで簡潔なコードを記述してください
// - 複雑なロジックや関数定義は避け、直接的な評価式を記述してください
//
// 【使用例】
//
// //移動の評価値計算
// if (step < 5) {
//   move_score = 
//     -15 * back_forth_from_goalline +  // 後退を重視（後退は+15、前進は-15）
//     8 * distance_defense_min;        // 守り手から離れることを重視
// } else {
//   move_score = 
//     -10 * back_forth_from_goalline +  // 後退を重視（後退は+10、前進は-10）
//     5 * distance_defense_min;        // 守り手から離れることを重視
// }
//
// //パスの評価値計算
// if (step < 5) {
//   pass_score = 
//     10 * distance_defense_throw_min;  // パスする側が守り手から離れていることを重視
// } else {
//   pass_score = 
//     -4 * pass_distance;               // パス距離は短い方が良い
// }
//
// ============================================
// 以下が現在のユーザーコード
// ============================================
`;

	const sections = [];

	if (/移動|move|movement/.test(normalized)) {
		const move = extractSection(baseCode, /\/\/\s*移動/, /\/\/\s*パス/);
		if (move.trim()) {
			sections.push("// 移動評価セクション\n" + move.trim());
		}
	}

	if (/パス|pass/.test(normalized)) {
		const pass = extractSection(baseCode, /\/\/\s*パス/, /\/\/\s*評価値/);
		if (pass.trim()) {
			sections.push("// パス評価セクション\n" + pass.trim());
		}
	}

	if (!sections.length) {
		return `${parameterDoc}\n${baseCode.trim()}`;
	}

	return `${parameterDoc}\n${baseCode.trim()}\n\n// --- Focus areas referenced in the user request ---\n${sections.join("\n\n")}`;
}

async function sendChat() {
	const message = inputField.value.trim();
	if (!message) {
		return;
	}

	const context = buildAttackContext(message);
	const payload = {
		message,
		context,
		history: conversationHistory.slice(-10), // 直近10件の会話履歴を送信
	};

	appendUserMessage(message);
	inputField.value = "";
	loadingIndicator.style.display = "block";

	try {
		const response = await fetch("chat.php", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			const errorDetail = typeof data.error === "object" && data.error !== null ? JSON.stringify(data.error) : data.error;
			const messageDetail = typeof data.message === "object" && data.message !== null ? JSON.stringify(data.message) : data.message;
			const detail = errorDetail || messageDetail || `status ${response.status}`;
			throw new Error(`Server responded with ${detail}`);
		}

		const reply = data.reply ?? "(応答を取得できませんでした)";

		loadingIndicator.style.display = "none";
		appendAIMessage(reply);
	} catch (error) {
		console.error("Error:", error);
		loadingIndicator.style.display = "none";
		appendSystemMessage(error.message);
	}
}

inputField.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		sendChat();
	}
});

// ページ読み込み時にチャットボックスの高さを0に初期化
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		adjustChatBoxHeight();
	});
} else {
	adjustChatBoxHeight();
}
