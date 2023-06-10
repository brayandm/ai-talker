"use client";

import AWS from "aws-sdk";
import { useRef } from "react";
import {
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";
interface AiTranscribeProps {
    accessKey: string;
    secretKey: string;
}

function AiTranscribe({ accessKey, secretKey }: AiTranscribeProps) {
    console.log("AQUi");
    const textRef = useRef<HTMLParagraphElement>(null);

    var awsCredentials = new AWS.Credentials(accessKey, secretKey);

    const client = new TranscribeStreamingClient({
        region: "us-east-1",
        credentials: awsCredentials,
    });

    const MicrophoneStream = require("microphone-stream").default;
    const mic = require("microphone-stream");
    const getUserMedia = require("get-user-media-promise");

    let micStream = new MicrophoneStream();

    const handleButtonClick = async () => {
        // this part should be put into an async function
        getUserMedia({ video: false, audio: true })
            .then(function (stream) {
                console.log("stream");
                micStream.setStream(stream);
            })
            .catch(function (error) {
                console.log(error);
            });
        const audioStream = async function* () {
            for await (const chunk of micStream) {
                console.log("chunk1");
                yield {
                    AudioEvent: {
                        AudioChunk:
                            pcmEncodeChunk(
                                chunk
                            ) /* pcm Encoding is optional depending on the source */,
                    },
                };
            }
        };

        const pcmEncodeChunk = (chunk: any) => {
            console.log("chunk");
            const input = mic.toRaw(chunk);
            var offset = 0;
            var buffer = new ArrayBuffer(input.length * 2);
            var view = new DataView(buffer);
            for (var i = 0; i < input.length; i++, offset += 2) {
                var s = Math.max(-1, Math.min(1, input[i]));
                view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            }
            return Buffer.from(buffer);
        };

        const command = new StartStreamTranscriptionCommand({
            // The language code for the input audio. Valid values are en-GB, en-US, es-US, fr-CA, and fr-FR
            LanguageCode: "en-US",
            // The encoding used for the input audio. The only valid value is pcm.
            MediaEncoding: "pcm",
            // The sample rate of the input audio in Hertz. We suggest that you use 8000 Hz for low-quality audio and 16000 Hz for
            // high-quality audio. The sample rate must match the sample rate in the audio file.
            MediaSampleRateHertz: 44100,
            AudioStream: audioStream(),
        });
        const response = await client.send(command);

        console.log("1", response);

        console.log("2", response.TranscriptResultStream);
        // This snippet should be put into an async function
        for await (const event of response.TranscriptResultStream) {
            if (event.TranscriptEvent) {
                const message = event.TranscriptEvent;
                // Get multiple possible results
                const results = event.TranscriptEvent.Transcript.Results;
                // Print all the possible transcripts
                results.map((result) => {
                    (result.Alternatives || []).map((alternative) => {
                        const transcript = alternative.Items.map(
                            (item) => item.Content
                        ).join(" ");
                        console.log(transcript);
                    });
                });
            }
        }
    };

    const handleStop = async () => {
        micStream.stop();
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
