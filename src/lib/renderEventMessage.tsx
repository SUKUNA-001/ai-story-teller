import { Frame } from "@gptscript-ai/gptscript";

const renderEventMessage = (event: Frame) => {
    switch(event.type){
        case "runStart":
            return <div>Run Started! at {event.start}</div>;
            case "callStart":
        return (
            <div>
                <p>Tool Starting: {event.tool?.description}</p>
            </div>
        );
        case "callProgress":
            return null;
        case "callFinish":
            return (
                <div>
                    Call finished:{" "}
                    {event.output?.map((output) => (
                        <div key={output.content}>{output.content}</div>
                    ))}
                </div>
            );
        case "runFinish":
        return <div>Run Finished! at {event.end}</div>;
        case "callSubCalls":
        return(
            <div>
                Sub-Content in progress:
                {event.output?.map((output, index) => (
                    <div key={index}>
                        <div>{output.content}</div>
                        {output.subCalls && 
                        Object.keys(output.subCalls).map((subCallKey) => (
                            <div key={subCallKey}>
                                <strong>SubCall: {subCallKey}</strong>
                                <div>Tools ID: {output.subCalls[subCallKey].toolID}</div>
                                <div>Input: {output.subCalls[subCallKey].input}</div>
                            </div>
                        ))}
                        </div>
                ))}
            </div>
        )
        case "callConfirm":
        return(
            <div>
                Call confirm:
                {event.output?.map((output, index) => (
                    <div key={index}>
                        <div>{output.content}</div>
                        {output.subCalls &&
                        Object.keys(output.subCalls).map((subCallKey) => (
                            <div key={subCallKey}>
                                <strong>SubCall: {subCallKey}:</strong>
                                <div>Tool ID: {output.subCalls[subCallKey].toolID}</div>
                                <div>Input: {output.subCalls[subCallKey].input}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
        default:
            return <pre>{JSON.stringify(event, null, 2)}</pre>
    };   
};

export default renderEventMessage;
