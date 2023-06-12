"use client";

import { useRef, useState, ChangeEvent } from "react";
import AWS from "aws-sdk";
import AwsPolly from "./AwsPolly";
import OpenAiGpt from "./OpenAiGpt";

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

        const callback = (text: string) => {
            const content = text as string;

            if (textRef.current) textRef.current.textContent += content;

            const symbols = [".", "?", "!"];

            let isSplited = false;

            for (let i = 0; i < content.length; i++) {
                if (symbols.includes(content[i])) {
                    const firstPart = content.substring(0, i + 1);
                    const secondPart = content.substring(i + 1);

                    chunk += firstPart;

                    kathy.speak(chunk);

                    chunk = secondPart;

                    isSplited = true;

                    break;
                }
            }

            if (!isSplited) {
                chunk += content;
            }
        };

        const onFinish = () => {
            kathy.speak(chunk);
        };

        const openAiGpt = new OpenAiGpt({ authorization: token });

        openAiGpt.callGpt(
            [{ role: "user", content: text }],
            callback,
            onFinish
        );

        kathy.forgetCachedSpeech();

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
