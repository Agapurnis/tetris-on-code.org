export {};

declare global {
    export interface ApplabMouseEvent {
        offsetX: number,
        currentTargetId: string,
        offsetY: number,
        movementX: number,
        pageX: number,
        movementY: number,
        pageY: number,
        targetId: string,
        clientX: number,
        clientY: number,
        button: number
        srcElementId: string,
        ctrlKey: false
        altKey: false
        x: number,
        y: number,
        metaKey: false
        type: string,
        which: number
        shiftKey: false
    }
    export function open (url: string): void;
    export function textLabel (id: string, text: string): void;
    export function textInput (id: string, text: string): void;
    export function setScreen (screen: string): void;
    export function setStyle (id: string, css: string): void;
    export function onEvent (id: string, event: string, callback: (parameter: unknown) => unknown): void;
    export function getProperty (id: string, property: string): unknown;
    export function setProperty (id: string, property: string, value: unknown): void;
    export function setText (id: string, text: string): void;
    export function getText (id: string): string;
    export function deleteElement (id: string): void;
    export function showElement (id: string): void;
    export function hideElement (id: string): void;
    export function getXPosition (id: string): number;
    export function getYPosition (id: string): number;
    export function setPosition (id: string, x: number, y: number): void;
    export function setPosition (id: string, x: number, y: number, width: number, height: number): void;
    export function write (html: string): void;
    
    // Data
    
    export function getUserId (): string;

    // Canvas
    
    export function putImageData (imageData: ImageData, x: number, y: number): void;
    export function getImageData (x: number, y: number, width: number, height: number): ImageData;
    export function setRGB (imageData: ImageData, x: number, y: number, red: number, green: number, blue: number, alpha?: number): void;
    export function createCanvas (id: string, width: number, height: number): void;
    export function setActiveCanvas (id: string): void;
    export function setFillColor (color: string): void;
    export function setStrokeColor (color: string): void;
    export function clearCanvas (): void;
    export function rect (x: number, y: number, width: number, height: number): void;
    export function line (x1: number, y1: number, x2: number, y2: number): void;
}
