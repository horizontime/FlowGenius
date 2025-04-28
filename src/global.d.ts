import { IChildRenderer } from "./child-process/preload";
import { IRenderer } from "./preload";

declare global {
    interface Window {
        electron: IRenderer & IChildRenderer
    }
}