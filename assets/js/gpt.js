
const inputField = document.getElementById("input-field");
const chatBox = document.getElementById("chat-box");
const loadingIndicator = document.getElementById("loadingIndicator");

// 会話履歴を保持する配列
const conversationHistory = [];

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
				// CodeMirrorの内部高さを取得
				const scrollInfo = codeEditor.getScrollInfo();
				const lineHeight = codeEditor.defaultLineHeight();
				const lineCount = codeEditor.lineCount();
				const calculatedHeight = lineCount * lineHeight + 30; // パディング用に30px追加
				const finalHeight = Math.min(calculatedHeight, 600); // 最大600px
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
	chatBox.scrollTop = chatBox.scrollHeight;
	// 会話履歴に追加
	conversationHistory.push({ role: "user", content: message });
}

function appendSystemMessage(message) {
	const entry = createMessageElement("System", message);
	entry.classList.add("text-secondary");
	chatBox.appendChild(entry);
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
	chatBox.scrollTop = chatBox.scrollHeight;
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
		return baseCode.trim();
	}

	return `${baseCode.trim()}\n\n// --- Focus areas referenced in the user request ---\n${sections.join("\n\n")}`;
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
