import {NextRequest} from "next/server";
import { RunEventType, RunOpts } from "@gptscript-ai/gptscript";
import g from "@/lib/gptScriptInstance";

const script = "app/api/run-script/story-book.gpt";

export async function POST(request: NextRequest){
const {story,pages,path} = await request.json();


////Example CLI Command: gptscript run "A story about a robot and a human become a friend"

const opts: RunOpts ={
    disableCache: true,
    input: `----story ${story} ---pages ${pages} ----${path}`
    };

    try {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller){
                try {
                    const run = await g.run(script, opts);

                    run.on(RunEventType.Event, data => {
                        controller.enqueue(
                            encoder.encode(
                            `event: ${JSON.stringify(data)}/n/n`));
                    });

                    await run.text();
                    controller.close()
                } catch (error) {
                    controller.error(error);
                    console.error("Errr" , error);
                }

            }
        });

        return new Response(stream,{
            headers: {
                "Content-Type":"text/event-source",
                "Cache-Control": "no-cache",
                Connection:"Keep Alive"
            }
        })
    } catch (error) {
        return new Response(JSON.stringify({error:error}),{
            status:500,
        })
    }
}