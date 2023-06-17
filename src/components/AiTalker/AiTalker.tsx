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
    defaultSpeech?: string;
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
    defaultSpeech = "Hola, soy tu asistente virtual. ¿En qué puedo ayudarte?",
}: AiTalkerProps) {
    const talkerRef = useRef<HTMLParagraphElement>(null);
    const humanRef = useRef<HTMLParagraphElement>(null);
    const upperCircle = useRef<HTMLDivElement>(null);
    const middleCircle = useRef<HTMLDivElement>(null);
    const lowerCircle = useRef<HTMLDivElement>(null);

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

                if (talkerRef.current) talkerRef.current.textContent = "";

                const onSpeakEnd = () => {
                    setIsRecording(true);
                    if (keepContext) {
                        setChat((prev) => [
                            ...prev,
                            { role: "assistant", content: speech },
                        ]);
                    }
                    updateSpeaker(0, true);
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

                if (humanRef.current) humanRef.current.textContent = "";

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
                        updateSpeaker(0, true, true);
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
        updateSpeaker(freq, false);
    };

    const handleButtonClick = () => {
        if (!isStarted) {
            updateSpeaker(0, true);
            polly.setUpAnalyser(onPlaying);

            const onSpeakEnd = () => {
                setIsStarted(true);
                setIsRecording(true);
            };

            polly.speak(defaultSpeech, false, onSpeakEnd);

            if (keepContext) {
                setChat([{ role: "assistant", content: defaultSpeech }]);
            }
        } else {
            setIsStarted(false);
            setIsRecording(true);
            setChat([]);
            openai.stopGpt();
            polly.shutUp();
            transcribe.stopRecording();
            if (talkerRef.current) talkerRef.current.textContent = "";
            if (humanRef.current) humanRef.current.textContent = "";
            updateSpeaker(0, true, true);
        }
    };

    function updateSpeaker(
        acum: number,
        easeTransition: boolean,
        isDown: boolean = false
    ) {
        const refArray = [upperCircle, middleCircle, lowerCircle];
        const sizes = [100, 80, 60];
        const sizesBW = [70, 50, 30];
        const colors = ["#9bdbf6", "#15a0e8", "white"];
        const colorsBW = ["#c7c7c7", "#6d6d6d", "white"];

        for (let i = 0; i < refArray.length; i++) {
            const ref = refArray[i];

            if (ref.current) {
                ref.current.style.width = `${
                    (isDown ? sizesBW[i] : sizes[i]) + acum
                }px`;
                ref.current.style.height = `${
                    (isDown ? sizesBW[i] : sizes[i]) + acum
                }px`;
                ref.current.style.backgroundColor = isDown
                    ? colorsBW[i]
                    : colors[i];
                if (easeTransition)
                    ref.current.style.transition = isDown
                        ? "ease width 0.6s, ease height 0.6s"
                        : "ease width 0.2s, ease height 0.2s";
                else ref.current.style.transition = "";
            }
        }
    }

    function getStyles(
        size: number,
        color: string,
        cursorPointer: boolean = false
    ) {
        return {
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: cursorPointer ? "pointer" : "default",
        };
    }

    return (
        <div>
            <div style={getStyles(300, "white")}>
                <div
                    ref={upperCircle}
                    style={getStyles(70, "#c7c7c7", true)}
                    onClick={() => handleButtonClick()}
                >
                    <div
                        ref={middleCircle}
                        style={getStyles(50, "#6d6d6d", true)}
                    >
                        <div
                            ref={lowerCircle}
                            style={getStyles(30, "white", true)}
                        ></div>
                    </div>
                </div>
            </div>
            {/* <button onClick={handleButtonClick}>Start</button>
            <button onClick={handleButtonClickStop}>stop</button> */}
            {/* <p ref={talkerRef} />
            <p ref={humanRef} /> */}
        </div>
    );
}

export default AiTalker;
