type OpenAiGptSettings = {
    openAiGptStreamerUrl: string;
    preMessages?: { role: string; content: string }[];
};
class OpenAiGpt {
    settings: OpenAiGptSettings;

    stopStreamSignal: boolean = false;

    constructor(settings: OpenAiGptSettings) {
        this.settings = settings;
    }

    stopGpt() {
        this.stopStreamSignal = true;
    }

    async callGpt(
        messages: { role: string; content: string }[],
        callback: (text: string) => void,
        onFinish: () => void
    ) {
        this.stopStreamSignal = false;

        const ws = new WebSocket(this.settings.openAiGptStreamerUrl);

        const onMessage = (data: string | null) => {
            if (this.stopStreamSignal) return;
            if (data) {
                callback(data);
            } else {
                this.stopStreamSignal = false;
                onFinish();
            }
        };

        ws.onerror = console.error;

        ws.onopen = () => {
            ws.send(
                JSON.stringify(
                    this.settings.preMessages
                        ? this.settings.preMessages.concat(messages)
                        : messages
                )
            );
        };

        ws.onmessage = (message) => {
            const response = JSON.parse(message.data.toString()) as {
                data: string | null;
            };

            onMessage(response.data);
        };
    }
}

export default OpenAiGpt;
