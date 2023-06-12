// import AiTalker from "@/components/AiTalker";
// import AiSpeaker from "@/components/AiSpeaker";
import AiTranscribe from "@/components/AiTranscribe";

export default function Home() {
    // return (
    //     <AiTalker
    //         token={process.env.OPENAI_API_KEY!}
    //         accessKey={process.env.AWS_ACCESS_KEY!}
    //         secretKey={process.env.AWS_SECRET_KEY!}
    //     />
    // );
    // return (
    //     <AiSpeaker
    //         accessKey={process.env.AWS_ACCESS_KEY!}
    //         secretKey={process.env.AWS_SECRET_KEY!}
    //     />
    // );
    return (
        <AiTranscribe
            accessKey={process.env.AWS_ACCESS_KEY!}
            secretKey={process.env.AWS_SECRET_KEY!}
        />
    );
}
