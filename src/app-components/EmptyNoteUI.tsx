import { FileText } from "lucide-react";
import React from "react";

export default React.memo((props: {onClick: Function}) => {
    return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an item to start editing</p>
            </div>
        </div>
    )
})