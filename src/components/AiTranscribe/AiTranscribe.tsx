"use client";

import AWS from "aws-sdk";

interface AiTranscribeProps {
    accessKey: string;
    secretKey: string;
}

function AiTranscribe({ accessKey, secretKey }: AiTranscribeProps) {
    var awsCredentials = new AWS.Credentials(accessKey, secretKey);

    return <p>Hello World!</p>;
}

export default AiTranscribe;
