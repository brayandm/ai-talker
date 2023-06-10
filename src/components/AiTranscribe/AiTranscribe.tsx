"use client";

import { useRef } from "react";

import * as TranscribeClient from "./transcribeClient";

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

    const handleButtonClick = async () => {
        TranscribeClient.startRecording("es-US", onTranscriptionDataReceived);
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
