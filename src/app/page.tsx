import AiTalker from "@/components/AiTalker";

export default function Home() {
    return <AiTalker token={process.env.OPENAI_API_KEY!} />;
}
