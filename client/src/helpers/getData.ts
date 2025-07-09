import qs from "qs";

import { IDataParams, IUrlTypes, TypeMapping } from "../models/getData";

export default async function getData<T extends IUrlTypes>({
  type,
  params = {},
  filters = {},
  populate = {},
  fields = [],
  sort = "",
  offset = 0,
  limit = 10,
}: IDataParams<T>): Promise<{ data: TypeMapping[T] }> {
  const query = qs.stringify(
    {
      populate,
      fields,
      filters,
      sort,
      pagination: { start: offset, limit },
      ...params,
    },
    {
      encodeValuesOnly: true,
    },
  );

  // TODO: move envs to a config file
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${type}?${query}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 0 }, // TODO: fix caching
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch data: ${res.statusText}, error code: ${res.status} with url: "${url}"`,
      );
    }

    return res.json();
  } catch (e) {
    console.log("Fetching data failed at ", url);
    console.error(e);

    return { data: [] } as any;
  }
}
