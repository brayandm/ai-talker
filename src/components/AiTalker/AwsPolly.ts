import { AwsCredentialIdentity, SdkStream } from "@aws-sdk/types";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

type AwsPollySettings = {
    awsCredentials: AwsCredentialIdentity;
    awsRegion: string;
    pollyEngine: string;
    pollyLanguageCode: string;
    pollyVoiceId: string;
    cacheSpeech: boolean;
};

type SpeechCacheRecord = {
    Message: string;
    AudioStream: string;
};

class AwsPolly {
    settings: AwsPollySettings;
    audioElement: HTMLAudioElement;
    isSpeakingNow: boolean;
    playlist: {
        message: string;
        joinWithPrevious: boolean;
    }[];

    constructor(settings: AwsPollySettings) {
        // Validate settings
        this.settings = this.getValidatedSettings(settings);

        // Add audio node to html
        var elementId = "audioElement" + new Date().valueOf().toString();
        this.audioElement = document.createElement("audio");
        this.audioElement.setAttribute("id", elementId);
        document.body.appendChild(this.audioElement);

        // Set up audio player
        this.isSpeakingNow = false;
        this.playlist = [];
    }

    // Speak
    speak(msg: string, joinWithPrevious: boolean = false): void {
        if (this.isSpeakingNow) {
            this.playlist.push({
                message: msg,
                joinWithPrevious: joinWithPrevious,
            });
        } else {
            this.say(msg).then(this.sayNext.bind(this));
        }
    }

    speakStream() {
        var chunk = "";

        const onSpeak = (message: string) => {
            const symbols = [".", "?", "!"];

            let isSplited = false;

            for (let i = 0; i < message.length; i++) {
                if (symbols.includes(message[i])) {
                    this.speak(chunk + message.substring(0, i + 1), true);
                    chunk = message.substring(i + 1);
                    isSplited = true;
                    break;
                }
            }

            if (!isSplited) {
                chunk += message;
            }
        };

        const onSpeakEnd = () => {
            this.speak(chunk, true);
        };

        return {
            onSpeak: onSpeak,
            onSpeakEnd: onSpeakEnd,
        };
    }

    // Quit speaking, clear playlist
    shutUp() {
        this.stop();
    }

    // Speak & return promise
    speakWithPromise(msg: string) {
        return this.say(msg);
    }

    isSpeaking() {
        return this.isSpeakingNow;
    }

    forgetCachedSpeech() {
        localStorage.removeItem("AwsPollyDictionary");
    }

    // Validate settings
    private getValidatedSettings(settings: AwsPollySettings) {
        if (typeof settings === "undefined") {
            throw "Settings must be provided to ChattyKathy's constructor";
        }
        if (typeof settings.awsCredentials === "undefined") {
            throw "A valid AWS Credentials object must be provided";
        }
        if (
            typeof settings.awsRegion === "undefined" ||
            settings.awsRegion.length < 1
        ) {
            throw "A valid AWS Region must be provided";
        }
        if (typeof settings.pollyEngine === "undefined") {
            settings.pollyEngine = "standard";
        }
        if (typeof settings.pollyLanguageCode === "undefined") {
            settings.pollyLanguageCode = "en-US";
        }
        if (typeof settings.pollyVoiceId === "undefined") {
            settings.pollyVoiceId = "Amy";
        }
        if (typeof settings.cacheSpeech === "undefined") {
            settings.cacheSpeech === true;
        }
        return settings;
    }

    // Quit talking
    private stop() {
        this.isSpeakingNow = false;
        this.audioElement.pause();
        this.playlist = [];
    }

    // Speak the message
    private say(message: string) {
        return new Promise((successCallback, errorCallback) => {
            this.isSpeakingNow = true;
            this.getAudio(message)
                ?.then(this.playAudio.bind(this))
                .then(successCallback);
        });
    }

    // Say next
    private sayNext() {
        var list = this.playlist;
        if (list.length > 0) {
            var msg = list[0].message;
            console.log(list[0]);
            list.splice(0, 1);
            this.say(msg).then(this.sayNext.bind(this));
        }
    }

    // Get Audio
    private getAudio(message: string) {
        if (
            this.settings.cacheSpeech === false ||
            this.requestSpeechFromLocalCache(message) === null
        ) {
            return this.requestSpeechFromAWS(message);
        } else {
            return this.requestSpeechFromLocalCache(message);
        }
    }

    // Make request to Amazon polly
    private requestSpeechFromAWS(message: string) {
        return new Promise((successCallback, errorCallback) => {
            var polly = new PollyClient({
                region: this.settings.awsRegion,
                credentials: this.settings.awsCredentials,
            });
            var params = {
                OutputFormat: "mp3",
                Engine: this.settings.pollyEngine,
                LanguageCode: this.settings.pollyLanguageCode,
                Text: `<speak>${message}</speak>`,
                VoiceId: this.settings.pollyVoiceId,
                TextType: "ssml",
            };
            polly.send(new SynthesizeSpeechCommand(params), (error, data) => {
                if (error) {
                    errorCallback(error);
                } else if (data) {
                    this.saveSpeechToLocalCache(message, data.AudioStream);
                    successCallback(data.AudioStream);
                }
            });
        });
    }

    // Save to local cache
    private saveSpeechToLocalCache(
        message: string,
        audioStream: SdkStream<any> | undefined
    ) {
        var record = {
            Message: message,
            AudioStream: JSON.stringify(audioStream),
        };
        var localPlaylist = JSON.parse(
            localStorage.getItem("AwsPollyDictionary") ?? "[]"
        );

        if (localPlaylist === null) {
            localPlaylist = [];
            localPlaylist.push(record);
        } else {
            localPlaylist.push(record);
        }
        localStorage.setItem(
            "AwsPollyDictionary",
            JSON.stringify(localPlaylist)
        );
    }

    // Check local cache for audio clip
    private requestSpeechFromLocalCache(message: string) {
        var audioDictionary = localStorage.getItem("AwsPollyDictionary");
        if (audioDictionary === null) {
            return null;
        }
        var audioStreamArray = JSON.parse(audioDictionary);
        var audioStream = audioStreamArray.filter(function (
            record: SpeechCacheRecord
        ) {
            return record.Message === message;
        })[0];

        if (audioStream === null || typeof audioStream === "undefined") {
            return null;
        } else {
            return new Promise(function (successCallback, errorCallback) {
                successCallback(JSON.parse(audioStream.AudioStream).data);
            });
        }
    }

    // Play audio
    private playAudio(audioStream: SdkStream<any> | undefined) {
        return new Promise(async (success, error) => {
            var arrayBuffer = await audioStream.transformToByteArray();
            var blob = new Blob([arrayBuffer]);

            var url = URL.createObjectURL(blob);
            this.audioElement.src = url;
            this.audioElement.addEventListener("ended", () => {
                this.isSpeakingNow = false;
                success("Success");
            });
            this.audioElement.play();
        });
    }
}

export default AwsPolly;
