"use client";

import { useState } from "react";
import { Select,  SelectContent, SelectValue, SelectItem, SelectTrigger } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "./button";
import { Frame } from "@gptscript-ai/gptscript"
import renderEventMessage from "@/lib/renderEventMessage";

const storiesPath = "public/stories";

function storywriter() {
  const[story, setStory] = useState<string>("")
  const[pages, setPages] = useState<number>()
  const[progress, setProgress] = useState("");
  const[runStart, setRunStart] = useState<boolean>(false);
  const[runFinished, setRunFinished] = useState<boolean | null>(null);
  const[currentTool,setCurrentTool] = useState("");
  const[events, setEvents] = useState<Frame[]>([]);

  async function runScript(){
    setRunStart(true);
    setRunFinished(false);

    const response = await fetch("/api/run-script",{
      method:'POST',
      headers: {
        "Content-Type":"application/json"
      },
      body: JSON.stringify({story , pages , path: storiesPath})
    });

    if(response.ok && response.body){
      ///Handle stream from the API
      //....
      console.log("Streaming started")

      const reader = response.body.getReader();
      const decode = new TextDecoder();

      handleStream(reader,decode);

    } else {
      setRunFinished(true);
      setRunStart(false);
      console.error('Pailed to start Streaming')
    }
  }

  async function handleStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder){

    /////MANAGE THE STREAM FROM THE API.........

    while(true){
      const {done,value} =await reader.read();

      if (done) break; /// breaks out of the infinite loops;

      const chunks = decoder.decode(value , {stream:true});

      // Explanaing : we spit the chunk into events by splitting it by the event: keyword. 
      const eventData = chunks
      .split("\n\n")
      .filter((line) => line.startsWith("event:"))
      .map((line) => line.replace("/^event:", " "));

      // Explain :we parse the Json data and the update the state accordindly.
      eventData.forEach(data => {
        try {
          const parsedData = JSON.parse(data);
          console.log(parsedData);

          if(parsedData.type === "callProgress"){
            setProgress(
              parsedData.output[parsedData.output.length - 1].content
            );
            setCurrentTool(parsedData.tool?.description || "");
          } else if (parsedData.type === "callStart"){
            setCurrentTool(parsedData.tool?.description || "");
          } else if(parsedData.type === "runfinish") {
            setRunFinished(true);
            setRunStart(false);
          }else{
            setEvents((prevEvents) => [...prevEvents, parsedData]);
          }
        } catch (error) {
          console.log("Error parsing data: Failed", error);
        }
      })
    }
  }

  return (
    <div className="flex flex-col container px-5">
        <section className="flex-1 flex flex-col border border-purple-800
        rounded-md p-10 space-y-2"> 
          <Textarea 
          value={story}
          onChange={(e)=>setStory(e.target.value)}
          className="flex-1 text-black"
          placeholder="Write a Story About a robot and a human who became a friends...."
          />

          <Select onValueChange={value => setPages(parseInt(value))}>
              <SelectTrigger>
                <SelectValue 
                placeholder="How many pages should be the story be?"/>
              </SelectTrigger>

              <SelectContent  className="w-full">
                {Array.from({ length:10 }, (_, i) => (
                     <SelectItem key={i} value={String(i + 1)}>
                      {i + 1} pages
                    </SelectItem>
                ))}
              </SelectContent>
          </Select>

          <Button disabled={!story || !pages || runStart} 
          className="w-full bg-black" size="lg"
          onClick={runScript}>
            Generate Story
          </Button>
        </section>

        <section className="flex-1 pb-5 mt-5">
              <div className="flex flex-col-reverse w-full space-y-2
              bg-gray-800 rounded-md text-gray-200 font-mono p-10
              h-96 overflow-y-auto">
                <div>
                  {runFinished === null && (
                    <>
                      <p className="animate-pulse mr-5">
                        I'm waiting for you to generate a story above...
                      </p>
                      <br/>
                    </>
                  )}

                  <span className="mr-5">{">>"}</span>
                  {progress}
                </div>

                {/* CURRENT TOOLS */}
                {currentTool && (
                  <div className="py-10  ">
                    <span className="mr-5">------</span>

                    {currentTool}
                  </div>
                )}


                {/*Render Evemnt */}
                <div className="space-y-5">
                  {events.map((event, index) => (
                    <div key={index}>
                      <span className="mr-5">{">>"}</span>
                      {renderEventMessage(event)}
                    </div>
                  ))}
                </div>

                {runStart && (
                  <div>
                    <span className="mr-5 animate-in">
                      {"-----[AI Story has Started]-----"}
                    </span>
                  </div>
                )}
              </div>
        </section>
    </div>
  )
}

export default storywriter