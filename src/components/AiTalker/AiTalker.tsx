"use client";

import { useRef, useState, ChangeEvent } from "react";
import AWS from "aws-sdk";
import AwsPolly from "./lib/AwsPolly";
import AwsTranscribe from "./lib/AwsTranscribe";
import OpenAiGpt from "./lib/OpenAiGpt";

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
            pollyEngine: "neural",
            pollyLanguageCode: "es-ES",
            pollyVoiceId: "Lucia",
            cacheSpeech: false,
        };

        var kathy = new AwsPolly(settings);

        const { onStream, onStreamEnd } = kathy.speakStream(onSpeakEnd);

        function onSpeakEnd() {
            console.log("onSpeakEnd");
        }

        const callback = (text: string) => {
            if (textRef.current) textRef.current.textContent += text;
            onStream(text);
        };

        const onFinish = () => {
            onStreamEnd();
        };

        const openAiGpt = new OpenAiGpt({ authorization: token });

        openAiGpt.callGpt(
            [{ role: "user", content: text }],
            callback,
            onFinish
        );

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
