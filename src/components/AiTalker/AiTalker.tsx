"use client";

import { useRef, useState, ChangeEvent } from "react";
import AWS from "aws-sdk";
// import ChattyKathy from "./lib";
import AwsPolly from "./AwsPolly";

interface AiTalkerProps {
    token: string;
    accessKey: string;
    secretKey: string;
}

function AiTalker({ token, accessKey, secretKey }: AiTalkerProps) {
    const textRef = useRef<HTMLParagraphElement>(null);

    const [text, setText] = useState("");

    const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
    };

    const handleButtonClick = () => {
        if (textRef.current) {
            textRef.current.textContent = "";
        }

        var awsCredentials = new AWS.Credentials(accessKey, secretKey);
        var settings = {
            awsCredentials: awsCredentials,
            awsRegion: "us-east-1",
            pollyEngine: "standard",
            pollyLanguageCode: "es-ES",
            pollyVoiceId: "Lucia",
            cacheSpeech: true,
        };

        var kathy = new AwsPolly(settings);

        var chunk = "";

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
                                content: text,
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
                        const content = json.choices[0].delta.content as string;

                        textRef.current.textContent += content;

                        const symbols = [".", "?", "!"];

                        let isSplited = false;

                        for (let i = 0; i < content.length; i++) {
                            if (symbols.includes(content[i])) {
                                const firstPart = content.substring(0, i + 1);
                                const secondPart = content.substring(i + 1);

                                chunk += firstPart;

                                kathy.Speak(chunk);

                                chunk = secondPart;

                                isSplited = true;

                                break;
                            }
                        }

                        if (!isSplited) {
                            chunk += content;
                        }
                    }
                });
                if (dataDone) {
                    kathy.Speak(chunk);
                    break;
                }
            }
        };

        chatGpt();

        kathy.ForgetCachedSpeech();

        setText("");
    };

    return (
        <div>
            <div>
                <textarea
                    value={text}
                    onChange={handleTextChange}
                    rows={4}
                    cols={50}
                />
                <button onClick={handleButtonClick}>Enviar</button>
            </div>
            <p ref={textRef} />
        </div>
    );
}

export default AiTalker;
