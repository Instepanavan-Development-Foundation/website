import { v4 as uuidv4 } from "uuid";

export default function generateSlug(event) {
  const { slug } = event.params.data;

  if (slug) {
    return slug;
  }

  return uuidv4();
}
