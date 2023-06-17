"use client";

import { use, useRef } from "react";

import AWS from "aws-sdk";

import AwsPolly from "./AwsPolly";

interface AiSpeakerProps {
    accessKey: string;
    secretKey: string;
}

function AiSpeaker({ accessKey, secretKey }: AiSpeakerProps) {
    var awsCredentials = new AWS.Credentials(accessKey, secretKey);
    var settings = {
        awsCredentials: awsCredentials,
        awsRegion: "us-east-1",
        pollyEngine: "standard",
        pollyLanguageCode: "es-ES",
        pollyVoiceId: "Lucia",
        cacheSpeech: false,
    };

    let kathy = new AwsPolly(settings);

    function updateSpeaker(freq: number, easeTransition: boolean) {
        const refArray = [upperCircle, middleCircle, lowerCircle];
        const sizes = [100, 80, 60];

        for (let i = 0; i < refArray.length; i++) {
            const ref = refArray[i];

            if (ref.current) {
                ref.current.style.width = `${sizes[i] + freq}px`;
                ref.current.style.height = `${sizes[i] + freq}px`;
                if (easeTransition)
                    ref.current.style.transition =
                        "ease width 0.2s, ease height 0.2s";
                else ref.current.style.transition = "";
            }
        }
    }

    function getStyles(size: number, color: string) {
        return {
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        };
    }

    function onPlaying(freq: number) {
        updateSpeaker(freq, false);
    }

    function onSpeakEnd() {
        updateSpeaker(0, true);
    }

    function onClick() {
        kathy.setUpAnalyser(onPlaying);
        kathy.speak("¡Hola mundo, mi nombre es Lucia!", false, onSpeakEnd);
    }

    function shutup() {
        if (kathy.isSpeaking()) {
            kathy.shutUp();
        }
        updateSpeaker(0, true);
    }

    const upperCircle = useRef<HTMLDivElement>(null);
    const middleCircle = useRef<HTMLDivElement>(null);
    const lowerCircle = useRef<HTMLDivElement>(null);

    return (
        <>
            <button onClick={onClick}>Speak</button>
            <button onClick={shutup}>ShutUp</button>
            <div style={getStyles(300, "white")}>
                <div ref={upperCircle} style={getStyles(100, "#9bdbf6")}>
                    <div ref={middleCircle} style={getStyles(80, "#15a0e8")}>
                        <div
                            ref={lowerCircle}
                            style={getStyles(60, "white")}
                        ></div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AiSpeaker;
