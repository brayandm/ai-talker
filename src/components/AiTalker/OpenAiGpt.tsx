class OpenAiGpt {
    settings: {
        authorization: string;
    };

    constructor(settings: { authorization: string }) {
        this.settings = settings;
    }

    callGpt(
        messages: { role: string; content: string }[],
        callback: (text: string) => void,
        onFinish: () => void
    ) {
        const gpt = async () => {
            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${this.settings.authorization}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: messages,
                        stream: true,
                    }),
                }
            );
            const reader = response.body
                ?.pipeThrough(new TextDecoderStream())
                .getReader();
            if (!reader) return;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                // eslint-disable-next-line no-await-in-loop
                const { value, done } = await reader.read();
                if (done) break;
                let dataDone = false;
                const arr = value.split("\n");
                arr.forEach((data) => {
                    if (data.length === 0) return; // ignore empty message
                    if (data.startsWith(":")) return; // ignore sse comment message
                    if (data === "data: [DONE]") {
                        dataDone = true;
                        return;
                    }
                    const json = JSON.parse(data.substring(6));
                    console.log(json.choices[0].delta.content);
                    if (json.choices[0].delta.content) {
                        callback(json.choices[0].delta.content);
                    }
                });
                if (dataDone) {
                    onFinish();
                    break;
                }
            }
        };

        gpt();
    }
}
