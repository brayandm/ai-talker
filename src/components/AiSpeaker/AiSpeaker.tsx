"use client";

import { useState, useRef } from "react";

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

    const [kathy] = useState<AwsPolly>(new AwsPolly(settings));

    const [isStarted, setIsStarted] = useState(false);

    function updateSpeaker(
        acum: number,
        easeTransition: boolean,
        isDown: boolean = false
    ) {
        const refArray = [upperCircle, middleCircle, lowerCircle];
        const sizes = [100, 80, 60];
        const sizesBW = [60, 40, 20];
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
                        ? "ease width 0.4s, ease height 0.4s"
                        : "ease width 0.2s, ease height 0.2s";
                else ref.current.style.transition = "";
            }
        }
    }

    function handleOnClick() {
        console.log("isStarted", isStarted);
        if (!isStarted) {
            updateSpeaker(0, true);
            kathy.setUpAnalyser(onPlaying);
            kathy.speak("¡Hola mundo, mi nombre es Lucia!", false, onSpeakEnd);
            setIsStarted(true);
        } else {
            updateSpeaker(0, true, true);
            if (kathy.isSpeaking()) {
                kathy.shutUp();
            }
            setIsStarted(false);
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
                <div
                    ref={upperCircle}
                    style={getStyles(60, "#c7c7c7", true)}
                    onClick={() => handleOnClick()}
                >
                    <div
                        ref={middleCircle}
                        style={getStyles(40, "#6d6d6d", true)}
                    >
                        <div
                            ref={lowerCircle}
                            style={getStyles(20, "white", true)}
                        ></div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AiSpeaker;
