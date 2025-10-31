
const inputField = document.getElementById("input-field");

async function sendChat() {
	const message = inputField.value.trim();
	if (!message) {
		return;
	}

	const chatBox = document.getElementById("chat-box");
	const loading = document.getElementById("loadingIndicator");
	const payload = {
		message,
		context: typeof loadAI === "function" ? loadAI() : "",
	};

	chatBox.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
	inputField.value = "";
	loading.style.display = "block";

	try {
		const response = await fetch("chat.php", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Server responded with ${response.status}`);
		}

		const data = await response.json();
		const reply = data.reply ?? "(応答を取得できませんでした)";

		loading.style.display = "none";
		chatBox.innerHTML += `<p><strong>AI:</strong> ${reply}</p>`;
		chatBox.scrollTop = chatBox.scrollHeight;
	} catch (error) {
		console.error("Error:", error);
		loading.style.display = "none";
		chatBox.innerHTML += `<p class="text-danger"><strong>System:</strong> AIとの通信でエラーが発生しました。</p>`;
	}
}

inputField.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		sendChat();
	}
});
