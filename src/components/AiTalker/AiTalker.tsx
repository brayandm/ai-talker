"use client";

import { useRef, useState, useEffect } from "react";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import AwsPolly from "./lib/AwsPolly";
import AwsTranscribe from "./lib/AwsTranscribe";
import OpenAiGpt from "./lib/OpenAiGpt";

interface AiTalkerProps {
    token: string;
    accessKey: string;
    secretKey: string;
}

function AiTalker({ token, accessKey, secretKey }: AiTalkerProps) {
    const talkerRef = useRef<HTMLParagraphElement>(null);
    const humanRef = useRef<HTMLParagraphElement>(null);

    var awsCredentials = {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    } as AwsCredentialIdentity;

    var pollySettings = {
        awsCredentials: awsCredentials,
        awsRegion: "us-east-1",
        pollyEngine: "neural",
        pollyLanguageCode: "es-ES",
        pollyVoiceId: "Lucia",
        cacheSpeech: false,
    };

    var transcribeSettings = {
        language: "es-US",
        region: "us-east-1",
        credentials: awsCredentials,
    };

    const [openai] = useState<OpenAiGpt>(
        new OpenAiGpt({ authorization: token })
    );

    const [polly] = useState<AwsPolly>(new AwsPolly(pollySettings));

    const [transcribe] = useState<AwsTranscribe>(
        new AwsTranscribe(transcribeSettings)
    );

    const [isRecording, setIsRecording] = useState(false);
    const [isStarted, setIsStarted] = useState(false);

    useEffect(() => {
        if (isStarted) {
            if (!isRecording) {
                const onSpeakEnd = () => {
                    setIsRecording(true);
                };

                const { onStream, onStreamEnd } = polly.speakStream(onSpeakEnd);

                const callback = (text: string) => {
                    if (talkerRef.current)
                        talkerRef.current.textContent += text;
                    onStream(text);
                };

                const onFinish = () => {
                    onStreamEnd();
                };

                openai.callGpt(
                    [{ role: "user", content: humanRef.current!.textContent! }],
                    callback,
                    onFinish
                );

                talkerRef.current!.textContent = "";
            } else {
                let timeId: NodeJS.Timeout;

                humanRef.current!.textContent = "";

                const onTranscriptionDataReceived = (data: string) => {
                    if (humanRef.current) {
                        humanRef.current.textContent += data;
                    }

                    if (timeId) clearTimeout(timeId);

                    timeId = setTimeout(() => {
                        transcribe.stopRecording();
                        setIsRecording(false);
                    }, 1000);
                };

                transcribe.startRecording(onTranscriptionDataReceived);
            }
        }
    }, [isStarted, isRecording, polly, transcribe, openai]);

    const handleButtonClick = () => {
        setIsStarted(true);
        setIsRecording(true);
    };

    const handleButtonClickStop = () => {
        setIsStarted(false);
        setIsRecording(true);
        openai.stopGpt();
        polly.shutUp();
        transcribe.stopRecording();
        talkerRef.current!.textContent = "";
        humanRef.current!.textContent = "";
    };

    return (
        <div>
            <button onClick={handleButtonClick}>Start</button>
            <button onClick={handleButtonClickStop}>stop</button>
            <p ref={talkerRef} />
            <p ref={humanRef} />
        </div>
    );
}

export default AiTalker;
