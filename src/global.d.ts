import { IChildRenderer } from "./child-process/preload";
import { IRenderer } from "./preload";

declare global {
    interface Window {
        electron: IRenderer & IChildRenderer;
        requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
        cancelIdleCallback?: (handle: number) => void;
    }
    
    interface IdleRequestCallback {
        (deadline: IdleDeadline): void;
    }

    interface IdleRequestOptions {
        timeout?: number;
    }

    interface IdleDeadline {
        didTimeout: boolean;
        timeRemaining(): number;
    }
}