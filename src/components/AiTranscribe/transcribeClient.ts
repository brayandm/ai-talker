import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import MicrophoneStream from "microphone-stream";
import { StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import { Buffer } from "buffer";
import AWS from "aws-sdk";

class AWSTrascribe {
    SAMPLE_RATE = 44100;
    microphoneStream: MicrophoneStream | undefined;
    transcribeClient: TranscribeStreamingClient | undefined;
    settings: {
        language: string;
        region: string;
        credentials: AWS.Credentials;
    };

    constructor(settings: {
        language: string;
        region: string;
        credentials: AWS.Credentials;
    }) {
        this.settings = settings;
    }

    createTranscribeClient(settings: {
        region: string;
        credentials: AWS.Credentials;
    }) {
        this.transcribeClient = new TranscribeStreamingClient({
            region: settings.region,
            credentials: settings.credentials,
        });
    }

    async createMicrophoneStream() {
        this.microphoneStream = new MicrophoneStream();
        this.microphoneStream.setStream(
            await window.navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true,
            })
        );
    }

    async startRecording(callback: (data: string) => void) {
        if (!this.settings.language) {
            return false;
        }
        if (this.microphoneStream || this.transcribeClient) {
            this.stopRecording();
        }
        this.createTranscribeClient(this.settings);
        this.createMicrophoneStream();
        await this.startStreaming(this.settings.language, callback);
    }

    stopRecording() {
        if (this.microphoneStream) {
            this.microphoneStream.stop();
            (this.microphoneStream as any).destroy();
            this.microphoneStream = undefined;
        }
        if (this.transcribeClient) {
            this.transcribeClient.destroy();
            this.transcribeClient = undefined;
        }
    }

    async startStreaming(language: string, callback: (data: string) => void) {
        const command = new StartStreamTranscriptionCommand({
            LanguageCode: language,
            MediaEncoding: "pcm",
            MediaSampleRateHertz: this.SAMPLE_RATE,
            AudioStream: this.getAudioStream(),
        });

        const data = await this.transcribeClient?.send(command);

        for await (const event of data?.TranscriptResultStream || []) {
            for (const result of event.TranscriptEvent?.Transcript?.Results ||
                []) {
                if (result.IsPartial === false) {
                    const data = result.Alternatives
                        ? result.Alternatives[0].Items
                            ? result.Alternatives[0].Items
                            : []
                        : [];

                    const noOfResults = data.length;

                    for (let i = 0; i < noOfResults; i++) {
                        callback(data[i].Content + " ");
                    }
                }
            }
        }
    }

    async *getAudioStream() {
        for await (const chunk of this
            .microphoneStream as unknown as Buffer[]) {
            if (chunk.length <= this.SAMPLE_RATE) {
                yield {
                    AudioEvent: {
                        AudioChunk: this.encodePCMChunk(chunk),
                    },
                };
            }
        }
    }

    encodePCMChunk(chunk: Buffer) {
        const input = MicrophoneStream.toRaw(chunk);
        let offset = 0;
        const buffer = new ArrayBuffer(input.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        return Buffer.from(buffer);
    }
}

export default AWSTrascribe;
