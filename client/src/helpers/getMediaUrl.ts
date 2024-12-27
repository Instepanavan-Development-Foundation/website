import { IMediaFormat } from "../models/image";

export default function getMediaSrc(media: IMediaFormat) {
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${media?.url}`;
}
