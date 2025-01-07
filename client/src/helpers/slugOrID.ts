export default function slugOrID(entity: { slug: string, id: string }) {
    return entity.slug || entity.id;
}