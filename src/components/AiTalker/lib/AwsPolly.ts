type AwsPollySettings = {
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
    audioElement?: HTMLAudioElement;
    isSpeakingNow: boolean;
    playlist: {
        message: string;
        joinWithPrevious: boolean;
        onSpeakEnd: () => void;
    }[];
    stopStreamSignal: boolean = false;
    analyser?: AnalyserNode;
    source?: MediaElementAudioSourceNode;
    onAnalyserPlaying?: () => void;
    isAnalyserSetUp: boolean = false;

    constructor(settings: AwsPollySettings) {
        // Validate settings
        this.settings = this.getValidatedSettings(settings);

        // Add audio node to html
        if (typeof window !== "undefined") {
            this.audioElement = new Audio();
            this.audioElement.load();
        }

        // Set up audio player
        this.isSpeakingNow = false;
        this.playlist = [];
    }

    setUpAnalyser(onPlaying: (freq: number) => void = () => {}) {
        if (!this.isAnalyserSetUp) {
            // Set up web audio object
            let audioContext = new AudioContext();
            this.analyser = audioContext.createAnalyser();
            this.analyser.connect(audioContext.destination);
            this.source = audioContext.createMediaElementSource(
                this.audioElement!
            );
            this.source.connect(this.analyser);
        }

        if (this.isAnalyserSetUp) {
            this.audioElement!.removeEventListener(
                "canplaythrough",
                this.onAnalyserPlaying!
            );
        }
        this.onAnalyserPlaying = () => {
            this.draw(onPlaying);
        };

        // async, wait for audio to load before connecting to audioContext
        this.audioElement!.addEventListener(
            "canplaythrough",
            this.onAnalyserPlaying
        );

        this.isAnalyserSetUp = true;
    }

    draw(onPlaying: (freq: number) => void) {
        var ID = requestAnimationFrame(this.draw.bind(this, onPlaying));
        if (this.audioElement!.paused) {
            cancelAnimationFrame(ID);
            return;
        }
        let data = this.getDataFromAudio(); // {f:array, t:array}
        let waveSum = 0;

        //draw live waveform and oscilloscope
        for (let i = 0; i < data.f.length; i++) {
            waveSum += data.f[i]; //add current bar value (max 255)
        }
        waveSum = waveSum / data.f.length; //get average of all bars

        onPlaying(waveSum);
    }

    getDataFromAudio() {
        //analyser.fftSize = 2048;
        let freqByteData = new Uint8Array(this.analyser!.fftSize / 2);
        let timeByteData = new Uint8Array(this.analyser!.fftSize / 2);
        this.analyser!.getByteFrequencyData(freqByteData);
        this.analyser!.getByteTimeDomainData(timeByteData);
        return { f: freqByteData, t: timeByteData }; // array of all 1024 levels
    }

    // Speak
    speak(
        msg: string,
        joinWithPrevious: boolean = false,
        onSpeakEnd: () => void = () => {}
    ): void {
        if (this.isSpeakingNow) {
            this.playlist.push({
                message: msg,
                joinWithPrevious: joinWithPrevious,
                onSpeakEnd: onSpeakEnd,
            });
        } else {
            this.say(msg).then(() => {
                onSpeakEnd();
                this.sayNext();
            });
        }
    }

    speakStream(onSpeakEnd: () => void = () => {}) {
        this.stopStreamSignal = false;

        var chunk = "";

        const onStream = (message: string) => {
            const symbols = [".", "?", "!"];
            const limChar = 200;

            let isSplited = false;

            for (let i = 0; i < message.length; i++) {
                if (
                    symbols.includes(message[i]) ||
                    (chunk.length + i > limChar && message[i] === " ")
                ) {
                    if (this.stopStreamSignal) break;
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

        const onStreamEnd = () => {
            if (this.stopStreamSignal) {
                this.stopStreamSignal = false;
                return;
            }
            this.speak(chunk, true, onSpeakEnd);
        };

        return {
            onStream: onStream,
            onStreamEnd: onStreamEnd,
        };
    }

    // Quit speaking, clear playlist
    shutUp() {
        this.stop();
        this.stopStreamSignal = true;
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
        this.audioElement!.pause();
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
            var msg = "";
            var callbackList: (() => void)[] = [];

            do {
                msg += list[0].message;
                callbackList.push(list[0].onSpeakEnd);
                list.splice(0, 1);
            } while (list.length > 0 && list[0].joinWithPrevious);

            this.say(msg).then(() => {
                callbackList.forEach((callback) => {
                    callback();
                });
                this.sayNext();
            });
        }
    }

    // Get Audio
    private getAudio(message: string): Promise<Uint8Array | null> | null {
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
    private requestSpeechFromAWS(text: string) {
        return new Promise<Uint8Array>((successCallback, errorCallback) => {
            const ws = new WebSocket("ws://127.0.0.1:8021/");

            ws.onerror = errorCallback;

            ws.onopen = () => {
                ws.send(
                    JSON.stringify({
                        text: text,
                        languageCode: this.settings.pollyLanguageCode,
                        voiceId: this.settings.pollyVoiceId,
                    })
                );
            };

            ws.onmessage = (message) => {
                const response = JSON.parse(message.data.toString()) as {
                    data: any;
                };

                console.log(response.data);

                if (this.settings.cacheSpeech)
                    this.saveSpeechToLocalCache(
                        text,
                        new Uint8Array(response.data)
                    );

                successCallback(new Uint8Array(response.data));
            };
        });
    }

    // Save to local cache
    private saveSpeechToLocalCache(message: string, audioStream: Uint8Array) {
        var record = {
            Message: message,
            AudioStream: JSON.stringify(Array.from(audioStream)),
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
    private requestSpeechFromLocalCache(
        message: string
    ): Promise<Uint8Array | null> | null {
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
                successCallback(
                    new Uint8Array(JSON.parse(audioStream.AudioStream))
                );
            });
        }
    }

    // Play audio
    private playAudio(arrayBuffer: Uint8Array | null) {
        if (arrayBuffer === null) {
            throw "Audio stream is null";
        }

        return new Promise(async (success, error) => {
            var blob = new Blob([arrayBuffer]);

            var url = URL.createObjectURL(blob);
            this.audioElement!.src = url;
            this.audioElement!.addEventListener("ended", () => {
                this.isSpeakingNow = false;
                success("Success");
            });
            this.audioElement!.play();
        });
    }
}

export default AwsPolly;
