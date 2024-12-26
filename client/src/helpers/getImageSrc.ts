import { IImage } from "../models/image";

export default function getImageSrc(image: IImage) {
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${image?.url}`;
}
