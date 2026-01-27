import { Zap } from "lucide-react";

export default function Page({ metadata, children }) {
    return (
        <div className="flex flex-col justify-center h-full w-full gap-4">
            <div className="flex flex-row justify-between items-center">
                <span className="text-4xl font-semibold">{metadata}</span>
                <div className="flex items-center gap-2">
                    <span>{"PowerUser26"}</span>
                    <div className="flex w-10 h-10 object-cover rounded-full border-2 border-corvid-blue/50 items-center justify-center">
                        <Zap className="stroke-black" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-4 h-full w-full overflow-hidden">
                {children}
            </div>
        </div>
    );
}