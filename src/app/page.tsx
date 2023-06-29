import AiTalker from "@/components/AiTalker";
import AiSpeaker from "@/components/AiSpeaker";
import AiTranscribe from "@/components/AiTranscribe";

export default function Home() {
    return (
        <AiTalker
            openAiGptStreamerUrl="ws://127.0.0.1:8020/"
            awsPollyStreamerUrl="ws://127.0.0.1:8021/"
            awsTranscribeStreamerUrl="ws://127.0.0.1:8022/"
        />
    );
    // return (
    //     <AiSpeaker
    //         accessKey={process.env.AWS_ACCESS_KEY!}
    //         secretKey={process.env.AWS_SECRET_KEY!}
    //     />
    // );
    // return (
    //     <AiTranscribe
    //         accessKey={process.env.AWS_ACCESS_KEY!}
    //         secretKey={process.env.AWS_SECRET_KEY!}
    //     />
    // );
}
