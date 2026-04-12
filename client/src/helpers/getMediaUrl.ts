import { IMediaFormat } from "../models/media";

export default function getMediaSrc(media: IMediaFormat) {
  return media?.url ?? "";
}
