"use client";

import AWS from "aws-sdk";

import ChattyKathy from "./lib";

interface AiSpeakerProps {
    accessKey: string;
    secretKey: string;
}

function AiSpeaker({ accessKey, secretKey }: AiSpeakerProps) {
    var awsCredentials = new AWS.Credentials(accessKey, secretKey);
    var settings = {
        awsCredentials: awsCredentials,
        awsRegion: "us-east-1",
        pollyEngine: "neural",
        pollyLanguageCode: "es-ES",
        pollyVoiceId: "Lucia",
        cacheSpeech: true,
    };
    var kathy = ChattyKathy(settings);

    function onClick() {
        kathy.Speak("¡Hola mundo, mi nombre es Lucia!");
        kathy.Speak(
            "¡Puedo ser utilizado para una experiencia de usuario increíble!"
        );

        kathy.ForgetCachedSpeech();
    }

    function shutup() {
        if (kathy.IsSpeaking()) {
            kathy.ShutUp();
        }
    }

    return (
        <>
            <button onClick={onClick}>Speak</button>
            <button onClick={shutup}>ShutUp</button>
        </>
    );
}

export default AiSpeaker;
