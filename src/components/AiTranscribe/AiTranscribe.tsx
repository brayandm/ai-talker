"use client";

import { useRef } from "react";

import AwsTranscribe from "./AwsTranscribe";

import AWS from "aws-sdk";

interface AiTranscribeProps {
    accessKey: string;
    secretKey: string;
}

function AiTranscribe({ accessKey, secretKey }: AiTranscribeProps) {
    const textRef = useRef<HTMLParagraphElement>(null);

    const onTranscriptionDataReceived = (data: string) => {
        console.log(data);
        if (textRef.current) {
            textRef.current.textContent += data;
        }
    };

    const onTimeout = (isAsleep: boolean) => {
        console.log("onTimeout", isAsleep);
    };

    const TranscribeClient = new AwsTranscribe({
        language: "es-US",
        region: "us-east-1",
        credentials: new AWS.Credentials(accessKey, secretKey),
    });

    const handleButtonClick = async () => {
        TranscribeClient.startRecording(onTranscriptionDataReceived, onTimeout);
    };

    const handleStop = async () => {
        TranscribeClient.stopRecording();
    };

    return (
        <div>
            <div>
                <button onClick={handleButtonClick}>Start Recording</button>
            </div>
            <div>
                <button onClick={handleStop}>Stop Recording</button>
            </div>
            <p ref={textRef} />
        </div>
    );
}

export default AiTranscribe;
