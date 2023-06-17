"use client";

import { useRef } from "react";

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

    function onPlaying(freq: number) {
        if (ref.current) {
            ref.current.style.width = `${100 + freq}px`;
            ref.current.style.height = `${100 + freq}px`;
            ref.current.style.transition = "";
        }
        if (ref2.current) {
            ref2.current.style.width = `${80 + freq}px`;
            ref2.current.style.height = `${80 + freq}px`;
            ref2.current.style.transition = "";
        }
        if (ref3.current) {
            ref3.current.style.width = `${60 + freq}px`;
            ref3.current.style.height = `${60 + freq}px`;
            ref3.current.style.transition = "";
        }
    }

    function onSpeakEnd() {
        if (ref.current) {
            ref.current.style.width = `${100}px`;
            ref.current.style.height = `${100}px`;
            ref.current.style.transition = "ease width 0.2s, ease height 0.2s";
        }
        if (ref2.current) {
            ref2.current.style.width = `${80}px`;
            ref2.current.style.height = `${80}px`;
            ref2.current.style.transition = "ease width 0.2s, ease height 0.2s";
        }
        if (ref3.current) {
            ref3.current.style.width = `${60}px`;
            ref3.current.style.height = `${60}px`;
            ref3.current.style.transition = "ease width 0.2s, ease height 0.2s";
        }
    }

    function onClick() {
        kathy.setUpAnalyser(onPlaying);
        kathy.speak("¡Hola mundo, mi nombre es Lucia!", false, onSpeakEnd);
    }

    function shutup() {
        if (kathy.isSpeaking()) {
            kathy.shutUp();
        }
    }

    const ref = useRef<HTMLDivElement>(null);
    const ref2 = useRef<HTMLDivElement>(null);
    const ref3 = useRef<HTMLDivElement>(null);

    return (
        <>
            <button onClick={onClick}>Speak</button>
            <button onClick={shutup}>ShutUp</button>
            <div
                style={{
                    marginTop: "100px",
                    marginLeft: "100px",
                    width: "500px",
                    height: "500px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <div
                    ref={ref}
                    style={{
                        width: "100px",
                        height: "100px",
                        backgroundColor: "#9bdbf6",
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div
                        ref={ref2}
                        style={{
                            width: "80px",
                            height: "80px",
                            backgroundColor: "#15a0e8",
                            borderRadius: "50%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <div
                            ref={ref3}
                            style={{
                                width: "60px",
                                height: "60px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AiSpeaker;
