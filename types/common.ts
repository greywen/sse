export enum SSEResultType {
  Image = 1,
  Think = 2,
  Text = 3,
  End = 4,
  Cancelled = 5,
  Error = 6,
}

interface SseResponseLineImage {
  t: SSEResultType.Image;
  r: string;
}

interface SseResponseLineThink {
  t: SSEResultType.Think;
  r: string;
}

interface SseResponseLineText {
  t: SSEResultType.Text;
  r: string;
}

interface SseResponseLineEnd {
  t: SSEResultType.End;
}

interface SseResponseLineCancelled {
  t: SSEResultType.Cancelled;
}

interface SseResponseLineError {
  t: SSEResultType.Error;
  r: string;
}

export type SseResponseLine =
  | SseResponseLineImage
  | SseResponseLineThink
  | SseResponseLineText
  | SseResponseLineEnd
  | SseResponseLineCancelled
  | SseResponseLineError;

export type ReqBody = {
  showHTTPError: boolean;
  showSSEError: boolean;
};
