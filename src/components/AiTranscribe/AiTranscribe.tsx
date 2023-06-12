"use client";

import { useRef } from "react";

import AWSTrascribe from "./transcribeClient";

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

    const TranscribeClient = new AWSTrascribe({
        language: "es-US",
        region: "us-east-1",
        credentials: new AWS.Credentials(accessKey, secretKey),
    });

    const handleButtonClick = async () => {
        TranscribeClient.startRecording(
            {
                language: "es-US",
                region: "us-east-1",
                credentials: new AWS.Credentials(accessKey, secretKey),
            },
            onTranscriptionDataReceived
        );
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
