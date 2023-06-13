"use client";

import { useRef, useState, useEffect } from "react";
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
    const robotRef = useRef<HTMLParagraphElement>(null);
    const meRef = useRef<HTMLParagraphElement>(null);

    var awsCredentials = new AWS.Credentials(accessKey, secretKey);

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

    const [polly] = useState<AwsPolly>(new AwsPolly(pollySettings));

    const [transcribe] = useState<AwsTranscribe>(
        new AwsTranscribe(transcribeSettings)
    );

    const [openai] = useState<OpenAiGpt>(
        new OpenAiGpt({ authorization: token })
    );

    const [isRecording, setIsRecording] = useState(false);
    const [isStarted, setIsStarted] = useState(false);

    useEffect(() => {
        if (isStarted) {
            if (!isRecording) {
                const onSpeakEnd = () => {
                    console.log("onSpeakEnd");
                    setIsRecording(true);
                };
                const { onStream, onStreamEnd } = polly.speakStream(onSpeakEnd);

                const callback = (text: string) => {
                    if (robotRef.current) robotRef.current.textContent += text;
                    onStream(text);
                };

                const onFinish = () => {
                    onStreamEnd();
                };

                openai.callGpt(
                    [{ role: "user", content: meRef.current!.textContent! }],
                    callback,
                    onFinish
                );
                robotRef.current!.textContent = "";
            } else {
                let timeId: NodeJS.Timeout;
                meRef.current!.textContent = "";

                const onTranscriptionDataReceived = (data: string) => {
                    console.log(data);
                    if (meRef.current) {
                        meRef.current.textContent += data;
                    }

                    if (timeId) clearTimeout(timeId);

                    timeId = setTimeout(() => {
                        setIsRecording(false);
                        transcribe.stopRecording();
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
        robotRef.current!.textContent = "";
        meRef.current!.textContent = "";
        setIsStarted(false);
        setIsRecording(true);
        polly.shutUp();
        transcribe.stopRecording();
    };

    return (
        <div>
            <button onClick={handleButtonClick}>Start</button>
            <button onClick={handleButtonClickStop}>stop</button>
            <p ref={robotRef} />
            <p ref={meRef} />
        </div>
    );
}

export default AiTalker;
