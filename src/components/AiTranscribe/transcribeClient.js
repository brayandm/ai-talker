/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
ABOUT THIS NODE.JS EXAMPLE: This example works with the AWS SDK for JavaScript version 3 (v3),
which is available at https://github.com/aws/aws-sdk-js-v3.

Purpose:
This file handles the transcription of speech to text using AWS Transcribe

*/
// snippet-start:[transcribeClient.JavaScript.streaming.createclientv3]
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import MicrophoneStream from "microphone-stream";
import { StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import { Buffer } from "buffer";

const SAMPLE_RATE = 44100;
let microphoneStream = undefined;
let transcribeClient = undefined;

export const startRecording = async (settings, callback) => {
    if (!settings.language) {
        return false;
    }
    if (microphoneStream || transcribeClient) {
        stopRecording();
    }
    createTranscribeClient(settings);
    createMicrophoneStream();
    await startStreaming(settings.language, callback);
};

export const stopRecording = function () {
    if (microphoneStream) {
        microphoneStream.stop();
        microphoneStream.destroy();
        microphoneStream = undefined;
    }
    if (transcribeClient) {
        transcribeClient.destroy();
        transcribeClient = undefined;
    }
};

const createTranscribeClient = (settings) => {
    transcribeClient = new TranscribeStreamingClient({
        region: settings.region,
        credentials: settings.credentials,
    });
};

const createMicrophoneStream = async () => {
    microphoneStream = new MicrophoneStream();
    microphoneStream.setStream(
        await window.navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
        })
    );
};

const startStreaming = async (language, callback) => {
    const command = new StartStreamTranscriptionCommand({
        LanguageCode: language,
        MediaEncoding: "pcm",
        MediaSampleRateHertz: SAMPLE_RATE,
        AudioStream: getAudioStream(),
    });
    const data = await transcribeClient.send(command);
    for await (const event of data.TranscriptResultStream) {
        for (const result of event.TranscriptEvent.Transcript.Results || []) {
            if (result.IsPartial === false) {
                const noOfResults = result.Alternatives[0].Items.length;
                for (let i = 0; i < noOfResults; i++) {
                    console.log(result.Alternatives[0].Items[i].Content);
                    callback(result.Alternatives[0].Items[i].Content + " ");
                }
            }
        }
    }
};

const getAudioStream = async function* () {
    for await (const chunk of microphoneStream) {
        if (chunk.length <= SAMPLE_RATE) {
            yield {
                AudioEvent: {
                    AudioChunk: encodePCMChunk(chunk),
                },
            };
        }
    }
};

const encodePCMChunk = (chunk) => {
    const input = MicrophoneStream.toRaw(chunk);
    let offset = 0;
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return Buffer.from(buffer);
};

// snippet-end:[transcribeClient.JavaScript.streaming.createclientv3]
