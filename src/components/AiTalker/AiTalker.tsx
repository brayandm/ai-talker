"use client";

import { useEffect, useRef } from "react";

interface AiTalkerProps {
    token: string;
}

function AiTalker({ token }: AiTalkerProps) {
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const chatGpt = async () => {
            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "user",
                                content: "Hola, ¿cómo estás?",
                            },
                        ],
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
                    if (textRef.current && json.choices[0].delta.content) {
                        textRef.current.textContent +=
                            json.choices[0].delta.content;
                    }
                });
                if (dataDone) break;
            }
        };

        chatGpt();
    }, [token]);

    return (
        <div>
            <p ref={textRef} />
        </div>
    );
}

export default AiTalker;
