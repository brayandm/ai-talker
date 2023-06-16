"use client";

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

    function onClick() {
        var kathy = new AwsPolly(settings);
        kathy.speak("¡Hola mundo, mi nombre es Lucia!");
    }

    function shutup() {
        // if (kathy.isSpeaking()) {
        //     kathy.shutUp();
        // }
    }

    return (
        <>
            <button onClick={onClick}>Speak</button>
            <button onClick={shutup}>ShutUp</button>
        </>
    );
}

export default AiSpeaker;
