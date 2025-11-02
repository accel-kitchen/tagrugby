
const inputField = document.getElementById("input-field");
const chatBox = document.getElementById("chat-box");
const loadingIndicator = document.getElementById("loadingIndicator");

function createMessageElement(role, text) {
	const entry = document.createElement("div");
	entry.className = `chat-entry chat-${role.toLowerCase()}`;
	const label = document.createElement("strong");
	label.textContent = `${role}:`;
	entry.appendChild(label);
	const body = document.createElement("span");
	body.className = "chat-text";
	body.style.whiteSpace = "pre-wrap";
	body.textContent = ` ${text}`;
	entry.appendChild(body);
	return entry;
}

function appendUserMessage(message) {
	const entry = createMessageElement("You", message);
	chatBox.appendChild(entry);
	chatBox.scrollTop = chatBox.scrollHeight;
}

function appendSystemMessage(message) {
	const entry = createMessageElement("System", message);
	entry.classList.add("text-secondary");
	chatBox.appendChild(entry);
	chatBox.scrollTop = chatBox.scrollHeight;
}

function applyCodeToEditor(code) {
	const editorInstance = window.attackEditor || window.editor;
	if (editorInstance && typeof editorInstance.setValue === "function") {
		editorInstance.setValue(code);
		editorInstance.focus();
		return true;
	}
	const textarea = document.CodingForm2 && document.CodingForm2.attackAIfunc;
	if (textarea) {
		textarea.value = code;
		return true;
	}
	return false;
}

function appendAIMessage(reply) {
	const entry = createMessageElement("AI", reply);
	chatBox.appendChild(entry);
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

	if (aiMatch) {
		baseCode = fetchFileSync(`AI/AI${aiMatch[1]}.js`) || "";
	}

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
