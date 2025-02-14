import { v4 as uuidv4 } from "uuid";

export default function generateSlug(event, field?: string) {
  const { slug } = event.params.data;

  if (slug) {
    return slug;
  }

  if (field) {
    return event.params.data[field].replace(" ", "-");
  }

  return uuidv4();
}
