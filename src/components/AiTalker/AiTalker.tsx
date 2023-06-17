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
    awsRegion?: string;
    pollyVoice?: string;
    pollyEngine?: string;
    pollyLanguage?: string;
    transcribeLanguage?: string;
    keepContext?: boolean;
}

function AiTalker({
    token,
    accessKey,
    secretKey,
    awsRegion = "us-east-1",
    pollyVoice = "Lucia",
    pollyEngine = "neural",
    pollyLanguage = "es-ES",
    transcribeLanguage = "es-US",
    keepContext = false,
}: AiTalkerProps) {
    const talkerRef = useRef<HTMLParagraphElement>(null);
    const humanRef = useRef<HTMLParagraphElement>(null);

    var awsCredentials = {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    } as AwsCredentialIdentity;

    var pollySettings = {
        awsCredentials: awsCredentials,
        awsRegion: awsRegion,
        pollyEngine: pollyEngine,
        pollyVoiceId: pollyVoice,
        pollyLanguageCode: pollyLanguage,
        cacheSpeech: false,
    };

    var transcribeSettings = {
        language: transcribeLanguage,
        region: awsRegion,
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
    const [chat, setChat] = useState<{ role: string; content: string }[]>([]);

    useEffect(() => {
        if (isStarted) {
            if (!isRecording) {
                let speech = "";

                talkerRef.current!.textContent = "";

                const onSpeakEnd = () => {
                    setIsRecording(true);
                    if (keepContext) {
                        setChat((prev) => [
                            ...prev,
                            { role: "assistant", content: speech },
                        ]);
                    }
                };

                const { onStream, onStreamEnd } = polly.speakStream(onSpeakEnd);

                const callback = (text: string) => {
                    if (talkerRef.current)
                        talkerRef.current.textContent += text;

                    speech += text;
                    onStream(text);
                };

                const onFinish = () => {
                    onStreamEnd();
                };

                openai.callGpt(chat, callback, onFinish);
            } else {
                let transcription = "";

                humanRef.current!.textContent = "";

                const onTranscriptionDataReceived = (data: string) => {
                    if (humanRef.current) {
                        humanRef.current.textContent += data;
                    }

                    transcription += data;
                };

                const onTimeout = (isAsleep: boolean) => {
                    transcribe.stopRecording();

                    if (isAsleep) {
                        setIsStarted(false);
                        setChat([]);
                    } else {
                        setIsRecording(false);

                        if (keepContext) {
                            setChat((prev) => [
                                ...prev,
                                { role: "user", content: transcription },
                            ]);
                        } else {
                            setChat([{ role: "user", content: transcription }]);
                        }
                    }
                };

                transcribe.startRecording(
                    onTranscriptionDataReceived,
                    onTimeout
                );
            }
        }
    }, [isStarted, isRecording, polly, transcribe, openai, chat, keepContext]);

    const onPlaying = (freq: number) => {
        console.log("playing", freq);
    };

    const handleButtonClick = () => {
        setIsStarted(true);
        setIsRecording(true);
        polly.setUpAnalyser(onPlaying);
    };

    const handleButtonClickStop = () => {
        setIsStarted(false);
        setIsRecording(true);
        setChat([]);
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
