import { randomUUID as uuidv4 } from "node:crypto";

export default function generateSlug(event) {
  const { slug } = event.params.data;

  if (slug) {
    return slug;
  }

  return uuidv4();
}
