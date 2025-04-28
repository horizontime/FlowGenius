import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";

export default React.memo((props: {onClick: Function}) => {
    return (
        <div className="w-[100%] h-[100%] flex items-center justify-center">
            <Button onClick={() => props.onClick()} className="bg-transparent [&:hover]:bg-transparent text-stone-800 dark:text-stone-300">
                <Plus className="w-[25px] h-[25px]" /> New note
            </Button>
        </div>
    )
})