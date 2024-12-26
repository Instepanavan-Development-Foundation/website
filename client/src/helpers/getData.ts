type IUrlTypes = "projects";

interface IDataParams {
  type: IUrlTypes;
  populate?: string;
  slug?: string;
  params?: string;
}

export default async function getData({
  type,
  slug,
  params,
  populate = "*",
}: IDataParams) {
  try {
    const url = getUrl({ type, slug, params, populate });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api${url}`,
      {
        next: { revalidate: 3600 },
      }
    );

    return res.json();
  } catch (e) {
    return { e };
  }
}

function getUrl({ type, slug, params, populate }: IDataParams) {
  return slug
    ? `/${type}?populate=${populate}&filters[slug][$eq]=${slug}&${params}`
    : `/${type}?populate=${populate}&${params}`;
}
